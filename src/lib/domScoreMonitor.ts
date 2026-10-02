import { RealLiveMatch } from "../components/GoogleMiniBrowser";

export interface DOMMatchResult {
  id?: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  minute?: string;
  status?: string;
  competition?: string;
  goalScorers?: string[];
  venue?: string;
  summary?: string;
}

export interface MonitorOptions {
  autoEstablish?: boolean;
  debounceMs?: number;
  triggerOnScoreChange?: boolean;
  triggerOnNewMatch?: boolean;
  onStatusChange?: (status: {
    active: boolean;
    detectedCount: number;
    lastDetected?: DOMMatchResult;
  }) => void;
}

/**
 * Extracts a match result from an element node using data attributes or semantic query selectors
 */
export function parseMatchElement(element: HTMLElement): DOMMatchResult | null {
  // 1. Try reading direct data attributes if present
  const dataId = element.getAttribute("data-match-id");
  const dataTeamA = element.getAttribute("data-team-a");
  const dataTeamB = element.getAttribute("data-team-b");
  const dataScoreA = element.getAttribute("data-score-a");
  const dataScoreB = element.getAttribute("data-score-b");
  const dataMinute = element.getAttribute("data-minute");
  const dataStatus = element.getAttribute("data-status");
  const dataCompetition = element.getAttribute("data-competition");

  if (dataTeamA && dataTeamB && dataScoreA !== null && dataScoreB !== null) {
    return {
      id: dataId || `match-${dataTeamA}-${dataTeamB}`,
      teamA: dataTeamA.trim(),
      teamB: dataTeamB.trim(),
      scoreA: parseInt(dataScoreA, 10) || 0,
      scoreB: parseInt(dataScoreB, 10) || 0,
      minute: dataMinute || "LIVE",
      status: dataStatus || "LIVE",
      competition: dataCompetition || "Live Match"
    };
  }

  // 2. Query child semantic selectors or text patterns
  const teamHomeEl = element.querySelector<HTMLElement>("[data-role='team-a'], .team-home, .team-a, h3, h4");
  const teamAwayEl = element.querySelector<HTMLElement>("[data-role='team-b'], .team-away, .team-b");
  const scoreEl = element.querySelector<HTMLElement>("[data-role='score'], .score, .match-score, .scores-display");

  if (teamHomeEl && teamAwayEl) {
    const teamA = teamHomeEl.textContent?.trim() || "";
    const teamB = teamAwayEl.textContent?.trim() || "";
    let scoreA = 0;
    let scoreB = 0;

    if (scoreEl) {
      const scoreText = scoreEl.textContent || "";
      const matchScore = scoreText.match(/(\d+)\s*[-:]\s*(\d+)/);
      if (matchScore) {
        scoreA = parseInt(matchScore[1], 10);
        scoreB = parseInt(matchScore[2], 10);
      }
    }

    if (teamA && teamB) {
      const minuteEl = element.querySelector<HTMLElement>("[data-role='minute'], .minute, .status");
      const compEl = element.querySelector<HTMLElement>("[data-role='competition'], .competition, .league-name");

      return {
        id: dataId || `match-${teamA}-${teamB}`,
        teamA,
        teamB,
        scoreA,
        scoreB,
        minute: minuteEl?.textContent?.trim() || "LIVE",
        status: minuteEl?.textContent?.includes("FT") ? "FINISHED" : "LIVE",
        competition: compEl?.textContent?.trim() || "Live Championship"
      };
    }
  }

  // 3. Fallback: Parse card text for standard score pattern e.g. "Real Madrid 2 - 1 Chelsea"
  const text = element.innerText || "";
  const genericMatch = text.match(/([A-Z][a-zA-Z\s]+?)\s+(\d+)\s*[-:]\s*(\d+)\s+([A-Z][a-zA-Z\s]+)/);
  if (genericMatch) {
    return {
      id: dataId || `match-${genericMatch[1].trim()}-${genericMatch[4].trim()}`,
      teamA: genericMatch[1].trim(),
      teamB: genericMatch[4].trim(),
      scoreA: parseInt(genericMatch[2], 10),
      scoreB: parseInt(genericMatch[3], 10),
      minute: "LIVE",
      status: "LIVE",
      competition: "Live Sports Broadcast"
    };
  }

  return null;
}

/**
 * Monitors the DOM of live score cards or embedded live views in the GoogleMiniBrowser,
 * and automatically triggers the 'onEstablishMatch' callback whenever a new match result or score change is detected.
 *
 * @param container The DOM element containing the live match results
 * @param onEstablishMatch Callback invoked with the full RealLiveMatch object when a new result is detected
 * @param options Monitoring configurations
 * @returns A cleanup function to disconnect the MutationObserver
 */
export function monitorLiveScoreDOM(
  container: HTMLElement | null,
  onEstablishMatch: (match: RealLiveMatch) => void,
  options: MonitorOptions = {}
): () => void {
  if (!container || typeof window === "undefined" || !("MutationObserver" in window)) {
    return () => {};
  }

  const {
    autoEstablish = true,
    debounceMs = 300,
    triggerOnScoreChange = true,
    triggerOnNewMatch = true,
    onStatusChange
  } = options;

  let debounceTimer: NodeJS.Timeout | null = null;
  let detectedCount = 0;

  // Track observed match signatures: `${teamA}-${teamB}-${scoreA}-${scoreB}-${status}`
  const seenSignatures = new Set<string>();
  const matchScoresMap = new Map<string, string>(); // `teamA vs teamB` -> `scoreA-scoreB`

  const scanDOMForMatchResults = () => {
    if (!container) return;

    // Find all potential match cards
    const cardElements = container.querySelectorAll<HTMLElement>(
      "[data-match-card='true'], [data-match-id], .group, .match-card"
    );

    cardElements.forEach((cardEl) => {
      const matchResult = parseMatchElement(cardEl);
      if (!matchResult) return;

      const { teamA, teamB, scoreA, scoreB, minute = "LIVE", status = "LIVE", competition = "Live Match" } = matchResult;
      const matchPairKey = `${teamA.toLowerCase()} vs ${teamB.toLowerCase()}`;
      const currentScoreKey = `${scoreA}-${scoreB}`;
      const signature = `${matchPairKey}-${currentScoreKey}-${status.toLowerCase()}`;

      const isNewMatch = !matchScoresMap.has(matchPairKey);
      const isScoreChanged = matchScoresMap.has(matchPairKey) && matchScoresMap.get(matchPairKey) !== currentScoreKey;

      if (!seenSignatures.has(signature)) {
        seenSignatures.add(signature);
        matchScoresMap.set(matchPairKey, currentScoreKey);

        const shouldTrigger =
          (isNewMatch && triggerOnNewMatch) ||
          (isScoreChanged && triggerOnScoreChange);

        if (shouldTrigger && autoEstablish) {
          detectedCount += 1;

          // Convert into structured RealLiveMatch
          const liveMatch: RealLiveMatch = {
            id: matchResult.id || `live-dom-${Date.now()}-${detectedCount}`,
            competition: competition,
            teamA: teamA,
            teamB: teamB,
            scoreA: scoreA,
            scoreB: scoreB,
            minute: minute,
            status: status,
            venue: matchResult.venue || "Live Match Venue",
            goalScorers: matchResult.goalScorers || [],
            summary:
              matchResult.summary ||
              `Real-time score update: ${teamA} ${scoreA} - ${scoreB} ${teamB} detected via Google Mini Browser live DOM monitor.`,
            possession: [50, 50],
            shots: [scoreA * 3 + 4, scoreB * 3 + 3],
            shotsOnTarget: [scoreA + 2, scoreB + 2],
            sources: [
              {
                title: "Live DOM Observer Telemetry",
                url: window.location.href
              }
            ]
          };

          // Automatically trigger the onEstablishMatch callback for real-time data flow
          onEstablishMatch(liveMatch);

          if (onStatusChange) {
            onStatusChange({
              active: true,
              detectedCount,
              lastDetected: matchResult
            });
          }
        }
      }
    });
  };

  // Initial immediate scan
  scanDOMForMatchResults();

  // Create MutationObserver
  const observer = new MutationObserver((mutations) => {
    let hasRelevantMutation = false;

    for (const mutation of mutations) {
      if (mutation.type === "childList" || mutation.type === "characterData") {
        hasRelevantMutation = true;
        break;
      }
      if (
        mutation.type === "attributes" &&
        (mutation.attributeName?.startsWith("data-") || mutation.attributeName === "class")
      ) {
        hasRelevantMutation = true;
        break;
      }
    }

    if (hasRelevantMutation) {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        scanDOMForMatchResults();
      }, debounceMs);
    }
  });

  observer.observe(container, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: [
      "data-match-id",
      "data-score-a",
      "data-score-b",
      "data-minute",
      "data-status",
      "class"
    ]
  });

  if (onStatusChange) {
    onStatusChange({
      active: true,
      detectedCount
    });
  }

  // Cleanup function
  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    observer.disconnect();
    if (onStatusChange) {
      onStatusChange({
        active: false,
        detectedCount
      });
    }
  };
}
