import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  TrendingUp, 
  PieChart, 
  Users, 
  RefreshCw, 
  HardDrive, 
  Sparkles, 
  HelpCircle,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  CloudLightning,
  ChevronRight
} from 'lucide-react';
import { useWorkspace } from './WorkspaceProvider';
import { googleSignIn } from '../lib/workspace';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

// --- Types & Interfaces ---
interface HistoricalMatch {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  goalsScored: number;
  goalsConceded: number;
  possession: number; // For homeTeam
  tacticalRating: number; // 0-100 overall match performance score
  result: 'W' | 'D' | 'L';
  source: 'Google Drive Archive' | 'Local Vault Core';
}

interface PlayerMetric {
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  rating: number; // 1-10
  passingAccuracy: number; // %
  sprintSpeed: number; // km/h
  interceptions: number;
}

// --- High-fidelity Local Vault Core Dataset ---
const LOCAL_VAULT_MATCHES: HistoricalMatch[] = [
  { id: 'm1', date: '2026-06-10', homeTeam: 'Argentina', awayTeam: 'France', goalsScored: 3, goalsConceded: 3, possession: 54, tacticalRating: 94, result: 'D', source: 'Local Vault Core' },
  { id: 'm2', date: '2026-06-12', homeTeam: 'Brazil', awayTeam: 'Germany', goalsScored: 2, goalsConceded: 0, possession: 58, tacticalRating: 88, result: 'W', source: 'Local Vault Core' },
  { id: 'm3', date: '2026-06-14', homeTeam: 'England', awayTeam: 'Spain', goalsScored: 1, goalsConceded: 2, possession: 45, tacticalRating: 81, result: 'L', source: 'Local Vault Core' },
  { id: 'm4', date: '2026-06-16', homeTeam: 'Japan', awayTeam: 'Portugal', goalsScored: 2, goalsConceded: 1, possession: 41, tacticalRating: 90, result: 'W', source: 'Local Vault Core' },
  { id: 'm5', date: '2026-06-18', homeTeam: 'Argentina', awayTeam: 'Brazil', goalsScored: 2, goalsConceded: 1, possession: 51, tacticalRating: 93, result: 'W', source: 'Local Vault Core' },
  { id: 'm6', date: '2026-06-20', homeTeam: 'France', awayTeam: 'Spain', goalsScored: 1, goalsConceded: 0, possession: 47, tacticalRating: 89, result: 'W', source: 'Local Vault Core' },
  { id: 'm7', date: '2026-06-21', homeTeam: 'Morocco', awayTeam: 'Germany', goalsScored: 0, goalsConceded: 2, possession: 44, tacticalRating: 82, result: 'L', source: 'Local Vault Core' },
  { id: 'm8', date: '2026-06-23', homeTeam: 'Portugal', awayTeam: 'England', goalsScored: 2, goalsConceded: 2, possession: 50, tacticalRating: 87, result: 'D', source: 'Local Vault Core' },
  { id: 'm9', date: '2026-06-25', homeTeam: 'France', awayTeam: 'Brazil', goalsScored: 3, goalsConceded: 1, possession: 52, tacticalRating: 91, result: 'W', source: 'Local Vault Core' },
  { id: 'm10', date: '2026-06-27', homeTeam: 'Argentina', awayTeam: 'Spain', goalsScored: 1, goalsConceded: 2, possession: 49, tacticalRating: 85, result: 'L', source: 'Local Vault Core' },
  { id: 'm11', date: '2026-06-28', homeTeam: 'Germany', awayTeam: 'Portugal', goalsScored: 2, goalsConceded: 0, possession: 55, tacticalRating: 86, result: 'W', source: 'Local Vault Core' },
  { id: 'm12', date: '2026-06-29', homeTeam: 'Japan', awayTeam: 'France', goalsScored: 1, goalsConceded: 3, possession: 39, tacticalRating: 83, result: 'L', source: 'Local Vault Core' }
];

const LOCAL_PLAYER_METRICS: PlayerMetric[] = [
  // FWDs
  { name: 'Lionel Messi', position: 'FWD', rating: 9.6, passingAccuracy: 91, sprintSpeed: 31.8, interceptions: 2 },
  { name: 'Kylian Mbappé', position: 'FWD', rating: 9.3, passingAccuracy: 84, sprintSpeed: 37.9, interceptions: 1 },
  { name: 'Vinícius Júnior', position: 'FWD', rating: 8.9, passingAccuracy: 82, sprintSpeed: 36.5, interceptions: 3 },
  { name: 'Antoine Griezmann', position: 'FWD', rating: 8.7, passingAccuracy: 88, sprintSpeed: 30.5, interceptions: 5 },
  { name: 'Bukayo Saka', position: 'FWD', rating: 8.5, passingAccuracy: 85, sprintSpeed: 34.2, interceptions: 4 },
  // MIDs
  { name: 'Jude Bellingham', position: 'MID', rating: 9.1, passingAccuracy: 89, sprintSpeed: 33.1, interceptions: 8 },
  { name: 'Kevin De Bruyne', position: 'MID', rating: 9.0, passingAccuracy: 93, sprintSpeed: 31.2, interceptions: 4 },
  { name: 'Rodri', position: 'MID', rating: 9.2, passingAccuracy: 95, sprintSpeed: 29.8, interceptions: 12 },
  { name: 'Bruno Fernandes', position: 'MID', rating: 8.4, passingAccuracy: 83, sprintSpeed: 30.9, interceptions: 6 },
  { name: 'Wataru Endo', position: 'MID', rating: 8.1, passingAccuracy: 87, sprintSpeed: 29.2, interceptions: 14 },
  { name: 'Federico Valverde', position: 'MID', rating: 8.8, passingAccuracy: 89, sprintSpeed: 35.4, interceptions: 9 },
  // DEFs
  { name: 'William Saliba', position: 'DEF', rating: 8.9, passingAccuracy: 94, sprintSpeed: 33.8, interceptions: 15 },
  { name: 'Virgil van Dijk', position: 'DEF', rating: 8.8, passingAccuracy: 92, sprintSpeed: 32.5, interceptions: 11 },
  { name: 'Alphonso Davies', position: 'DEF', rating: 8.4, passingAccuracy: 86, sprintSpeed: 37.1, interceptions: 8 },
  { name: 'Achraf Hakimi', position: 'DEF', rating: 8.6, passingAccuracy: 85, sprintSpeed: 36.2, interceptions: 10 },
  { name: 'Cristian Romero', position: 'DEF', rating: 8.5, passingAccuracy: 89, sprintSpeed: 31.9, interceptions: 13 },
  // GKs
  { name: 'Emiliano Martínez', position: 'GK', rating: 9.0, passingAccuracy: 78, sprintSpeed: 22.4, interceptions: 0 },
  { name: 'Mike Maignan', position: 'GK', rating: 8.7, passingAccuracy: 82, sprintSpeed: 23.5, interceptions: 0 },
  { name: 'Alisson Becker', position: 'GK', rating: 8.9, passingAccuracy: 85, sprintSpeed: 21.8, interceptions: 0 }
];

export const PerformanceAnalytics: React.FC = () => {
  const { hasGmailAccess, accessToken, setGmailAccess } = useWorkspace();
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeMetricTab, setActiveMetricTab] = useState<'rating' | 'passing' | 'speed'>('rating');

  // Interactive Filter States
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<'ALL' | 'DRIVE' | 'VAULT'>('ALL');

  // Chart Container Refs for pure D3.js and ResizeObservers
  const trendsContainerRef = useRef<HTMLDivElement>(null);
  const trendsSvgRef = useRef<SVGSVGElement>(null);

  const winRatesContainerRef = useRef<HTMLDivElement>(null);
  const winRatesSvgRef = useRef<SVGSVGElement>(null);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerSvgRef = useRef<SVGSVGElement>(null);

  // Tooltip element (div overlay inside container)
  const [tooltipContent, setTooltipContent] = useState<{
    x: number;
    y: number;
    visible: boolean;
    title: string;
    items: { label: string; value: string; color?: string }[];
  }>({ x: 0, y: 0, visible: false, title: '', items: [] });

  // --- Scan Drive Files & Try to Parse Match Stats ---
  const fetchDriveMatches = async () => {
    if (!accessToken) return;
    setIsScanning(true);
    try {
      const response = await fetch('/api/drive/list', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!response.ok) throw new Error('Could not access Drive vaults');
      const data = await response.json();
      setDriveFiles(data.files || []);
      toast.success(`Synced Drive Vault! Scanned ${data.files?.length || 0} items.`);
    } catch (err: any) {
      toast.error(err.message || 'Error syncing Drive documents');
      if (err.message?.includes('401') || err.message?.includes('token')) {
        setGmailAccess(null);
      }
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (hasGmailAccess) {
      fetchDriveMatches();
    }
  }, [hasGmailAccess]);

  // Autogenerate sample scouting & match HTML files into Google Drive to demonstrate real integrations
  const handleAutogenerateReports = async () => {
    if (!accessToken) return;
    setIsGenerating(true);
    toast.info("Generating tactical files in Drive...", { duration: 3000 });

    const reports = [
      {
        name: "Tactical Report: France vs Argentina (3-3).html",
        content: `
          <html>
            <body style="font-family: monospace; background: #050811; color: white; padding: 20px;">
              <h2>TACTICAL REPORT: FRANCE vs ARGENTINA</h2>
              <p>MATCH DATE: June 10, 2026</p>
              <p>GOALS SCRIBED: France (3) - Argentina (3)</p>
              <p>TACTICAL VALUE RATING: 94/100</p>
              <p>POSSESSION STAT: France (46%) - Argentina (54%)</p>
              <div style="border: 1px solid #ffffff10; padding: 15px; margin-top: 10px;">
                <strong>MATCH SUMMATION:</strong>
                An electric tactical faceoff. Home tactics relied on wide counter-attacks, whereas Away executed high central pressing.
              </div>
            </body>
          </html>
        `
      },
      {
        name: "Scouting Report: Germany (86 Tactical Score).html",
        content: `
          <html>
            <body style="font-family: monospace; background: #050811; color: white; padding: 20px;">
              <h2>SCOUTING PROFILE: GERMANY</h2>
              <p>CREATION DATE: June 28, 2026</p>
              <p>TACTICAL EVALUATION RATING: 86/100</p>
              <p>PREFERRED FORMATION: 4-2-3-1</p>
              <p>CORE STRENGTH: Rapid wing transition and defensive block coordination.</p>
            </body>
          </html>
        `
      },
      {
        name: "Match Report: Japan vs France (1-3).html",
        content: `
          <html>
            <body style="font-family: monospace; background: #050811; color: white; padding: 20px;">
              <h2>MATCH REPORT: JAPAN vs FRANCE</h2>
              <p>DATE: June 29, 2026</p>
              <p>FINAL SCORE: Japan (1) vs France (3)</p>
              <p>TACTICAL RATING: 83</p>
            </body>
          </html>
        `
      }
    ];

    try {
      for (const r of reports) {
        await fetch('/api/drive/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: r.name,
            content: r.content,
            mimeType: 'text/html',
            accessToken
          }),
        });
      }
      toast.success("Successfully injected 3 tactical reports into Drive!");
      await fetchDriveMatches();
    } catch (err) {
      toast.error("Failed to generate Workspace files");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConnect = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGmailAccess(result.accessToken);
        toast.success("Workspace Connected for Performance Analytics!");
      }
    } catch (err) {
      toast.error("Failed to connect Workspace");
    }
  };

  // Parse scanned Google Drive file titles to extract dynamic match data points!
  // If no files match, we seamlessly fallback to our high-fidelity cached local database.
  const driveMatches = useMemo<HistoricalMatch[]>(() => {
    const extracted: HistoricalMatch[] = [];
    driveFiles.forEach((file, index) => {
      const name = file.name || '';
      
      // Match Report Pattern: "Match Report: TeamA vs TeamB (ScoreA-ScoreB)" or similar
      // Or "Tactical Report: France vs Argentina (3-3)"
      const isMatch = name.toLowerCase().includes('match') || name.toLowerCase().includes('vs');
      const isScouting = name.toLowerCase().includes('scouting') || name.toLowerCase().includes('tactical');
      
      if (isMatch) {
        // Try parsing names like: "Tactical Report: France vs Argentina (3-3).html" or "Match Report: Japan vs France (1-3)"
        let teamA = 'Home Node';
        let teamB = 'Away Node';
        let goalsA = 2;
        let goalsB = 1;
        
        const cleanName = name.replace('.html', '').replace('Tactical Report: ', '').replace('Match Report: ', '');
        const teamsPart = cleanName.split('(')[0]?.split('vs') || cleanName.split('vs');
        
        if (teamsPart.length >= 2) {
          teamA = teamsPart[0].trim();
          teamB = teamsPart[1].trim();
        }

        // Try extracting scores inside brackets e.g. (3-3)
        const scoreMatch = cleanName.match(/\((\d+)[-\s:]+(\d+)\)/) || name.match(/(\d+)[-\s:]+(\d+)/);
        if (scoreMatch && scoreMatch.length >= 3) {
          goalsA = parseInt(scoreMatch[1]) || 0;
          goalsB = parseInt(scoreMatch[2]) || 0;
        } else {
          // Semi-random deterministic based on name hash
          goalsA = (cleanName.length % 4);
          goalsB = (cleanName.charCodeAt(0) % 3);
        }

        const dateStr = file.createdTime ? file.createdTime.split('T')[0] : new Date().toISOString().split('T')[0];
        const res: 'W' | 'D' | 'L' = goalsA > goalsB ? 'W' : (goalsA === goalsB ? 'D' : 'L');
        
        extracted.push({
          id: file.id || `drv-${index}`,
          date: dateStr,
          homeTeam: teamA,
          awayTeam: teamB,
          goalsScored: goalsA,
          goalsConceded: goalsB,
          possession: 45 + (cleanName.charCodeAt(0) % 15),
          tacticalRating: 75 + (cleanName.length % 21),
          result: res,
          source: 'Google Drive Archive'
        });
      } else if (isScouting) {
        // Try parsing scouting files: "Scouting Profile: Germany" or "Scouting Report: Portugal"
        const country = name.replace('Scouting Profile: ', '').replace('Scouting Report: ', '').split('(')[0]?.trim() || 'Scouted Unit';
        const ratingMatch = name.match(/(\d+)\s*Tactical/i) || name.match(/rating\s*(\d+)/i);
        const rating = ratingMatch ? parseInt(ratingMatch[1]) : 85;

        const dateStr = file.createdTime ? file.createdTime.split('T')[0] : new Date().toISOString().split('T')[0];

        extracted.push({
          id: file.id || `drv-${index}`,
          date: dateStr,
          homeTeam: country,
          awayTeam: 'Opponent Block',
          goalsScored: 2,
          goalsConceded: 1,
          possession: 50,
          tacticalRating: rating,
          result: 'W',
          source: 'Google Drive Archive'
        });
      }
    });

    return extracted;
  }, [driveFiles]);

  // Combine Local and Drive matches based on selected filters
  const allMatches = useMemo<HistoricalMatch[]>(() => {
    let combined = [...LOCAL_VAULT_MATCHES];
    if (driveMatches.length > 0) {
      combined = [...driveMatches, ...combined];
    }

    // Filter by Source
    if (selectedSource === 'DRIVE') {
      combined = combined.filter(m => m.source === 'Google Drive Archive');
    } else if (selectedSource === 'VAULT') {
      combined = combined.filter(m => m.source === 'Local Vault Core');
    }

    // Filter by Team Name
    if (selectedHomeTeam !== 'ALL') {
      combined = combined.filter(m => m.homeTeam === selectedHomeTeam || m.awayTeam === selectedHomeTeam);
    }

    // Sort Chronologically for trend lines
    return combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [driveMatches, selectedSource, selectedHomeTeam]);

  // Available unique teams for filter options
  const uniqueTeams = useMemo(() => {
    const teams = new Set<string>();
    LOCAL_VAULT_MATCHES.forEach(m => {
      teams.add(m.homeTeam);
      teams.add(m.awayTeam);
    });
    driveMatches.forEach(m => {
      teams.add(m.homeTeam);
      teams.add(m.awayTeam);
    });
    return Array.from(teams).sort();
  }, [driveMatches]);

  // Win, Draw, Loss count calculations
  const matchRatios = useMemo(() => {
    let wins = 0;
    let draws = 0;
    let losses = 0;

    allMatches.forEach((m) => {
      if (m.result === 'W') wins++;
      else if (m.result === 'D') draws++;
      else if (m.result === 'L') losses++;
    });

    const total = wins + draws + losses || 1;
    return [
      { label: 'WINS', value: wins, percentage: Math.round((wins / total) * 100), color: '#3b82f6' }, // cyan/blue
      { label: 'DRAWS', value: draws, percentage: Math.round((draws / total) * 100), color: '#64748b' }, // grey/slate
      { label: 'LOSSES', value: losses, percentage: Math.round((losses / total) * 100), color: '#ef4444' } // rose/red
    ];
  }, [allMatches]);

  // --- D3.JS CHART 1: HISTORICAL TRENDS (LINE & AREA CHART) ---
  useEffect(() => {
    if (!trendsContainerRef.current || !trendsSvgRef.current || allMatches.length === 0) return;

    // Handle responsive container resizing
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      renderTrendsChart(width, height || 300);
    });

    resizeObserver.observe(trendsContainerRef.current);
    
    // Initial Render
    const initialWidth = trendsContainerRef.current.clientWidth;
    renderTrendsChart(initialWidth, 300);

    return () => resizeObserver.disconnect();

    function renderTrendsChart(containerWidth: number, containerHeight: number) {
      const margin = { top: 30, right: 30, bottom: 50, left: 45 };
      const width = containerWidth - margin.left - margin.right;
      const height = containerHeight - margin.top - margin.bottom;

      // Select SVG and clear
      const svg = d3.select(trendsSvgRef.current);
      svg.selectAll('*').remove();

      const g = svg
        .attr('width', containerWidth)
        .attr('height', containerHeight)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      // Scales
      const xScale = d3.scalePoint()
        .domain(allMatches.map((d, i) => i.toString()))
        .range([0, width]);

      const maxScore = d3.max(allMatches, (d: any) => Math.max(d.goalsScored, d.goalsConceded)) || 3;
      const yScale = d3.scaleLinear()
        .domain([0, maxScore + 0.5])
        .range([height, 0]);

      // Gridlines
      const yGrid = d3.axisLeft(yScale)
        .ticks(5)
        .tickSize(-width)
        .tickFormat(() => '');

      g.append('g')
        .attr('class', 'text-zinc-800 opacity-20')
        .call(yGrid);

      // Axes
      const xAxis = d3.axisBottom(xScale)
        .tickFormat((d, i) => {
          const m = allMatches[parseInt(d)];
          return m ? `${m.homeTeam.slice(0,3)} vs ${m.awayTeam.slice(0,3)}` : '';
        });

      const yAxis = d3.axisLeft(yScale)
        .ticks(maxScore + 1)
        .tickFormat(d => d.toString());

      g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .attr('class', 'font-mono text-[9px] text-zinc-500')
        .call(xAxis)
        .selectAll('text')
        .attr('transform', 'rotate(-35)')
        .attr('text-anchor', 'end')
        .attr('dx', '-0.5em')
        .attr('dy', '0.5em')
        .style('fill', '#94a3b8');

      g.append('g')
        .attr('class', 'font-mono text-[9px] text-zinc-500')
        .call(yAxis)
        .selectAll('text')
        .style('fill', '#94a3b8');

      // Areas & Paths Generators
      const areaScored = d3.area<HistoricalMatch>()
        .x((d, i) => xScale(i.toString()) || 0)
        .y0(height)
        .y1(d => yScale(d.goalsScored))
        .curve(d3.curveMonotoneX);

      const lineScored = d3.line<HistoricalMatch>()
        .x((d, i) => xScale(i.toString()) || 0)
        .y(d => yScale(d.goalsScored))
        .curve(d3.curveMonotoneX);

      const lineConceded = d3.line<HistoricalMatch>()
        .x((d, i) => xScale(i.toString()) || 0)
        .y(d => yScale(d.goalsConceded))
        .curve(d3.curveMonotoneX);

      // Gradient for filled area
      const defs = svg.append('defs');
      const gradient = defs.append('linearGradient')
        .attr('id', 'scored-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#3b82f6')
        .attr('stop-opacity', 0.25);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#3b82f6')
        .attr('stop-opacity', 0);

      // Render Area Scored
      g.append('path')
        .datum(allMatches)
        .attr('fill', 'url(#scored-gradient)')
        .attr('d', areaScored);

      // Render Goals Scored Line
      g.append('path')
        .datum(allMatches)
        .attr('fill', 'none')
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 3)
        .attr('d', lineScored);

      // Render Goals Conceded Line
      g.append('path')
        .datum(allMatches)
        .attr('fill', 'none')
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('d', lineConceded);

      // Interactive Interactive Dot Highlights & Tooltips
      const dotsGroup = g.append('g');

      allMatches.forEach((d, i) => {
        const xVal = xScale(i.toString()) || 0;
        const yVal = yScale(d.goalsScored);

        dotsGroup.append('circle')
          .attr('cx', xVal)
          .attr('cy', yVal)
          .attr('r', 5)
          .attr('fill', '#050811')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 2)
          .style('cursor', 'pointer')
          .on('mouseover', (event) => {
            d3.select(event.currentTarget)
              .transition()
              .duration(150)
              .attr('r', 8)
              .attr('fill', '#3b82f6');

            // Set stateful tooltip
            const bounds = trendsContainerRef.current?.getBoundingClientRect();
            setTooltipContent({
              visible: true,
              x: event.clientX - (bounds?.left || 0) + 15,
              y: event.clientY - (bounds?.top || 0) - 80,
              title: `${d.homeTeam} vs ${d.awayTeam}`,
              items: [
                { label: 'Date', value: d.date },
                { label: 'Scored', value: `${d.goalsScored} Goals`, color: 'text-blue-400' },
                { label: 'Conceded', value: `${d.goalsConceded} Goals`, color: 'text-red-400' },
                { label: 'Tactical rating', value: `${d.tacticalRating}/100`, color: 'text-amber-400' },
                { label: 'Possession', value: `${d.possession}%` },
                { label: 'Source', value: d.source }
              ]
            });
          })
          .on('mouseout', (event) => {
            d3.select(event.currentTarget)
              .transition()
              .duration(150)
              .attr('r', 5)
              .attr('fill', '#050811');

            setTooltipContent(prev => ({ ...prev, visible: false }));
          });
      });
    }
  }, [allMatches]);

  // --- D3.JS CHART 2: WIN RATE (DONUT CHART WITH LEGEND) ---
  useEffect(() => {
    if (!winRatesContainerRef.current || !winRatesSvgRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      renderWinRateChart(width, height || 250);
    });

    resizeObserver.observe(winRatesContainerRef.current);
    const initialWidth = winRatesContainerRef.current.clientWidth;
    renderWinRateChart(initialWidth, 250);

    return () => resizeObserver.disconnect();

    function renderWinRateChart(containerWidth: number, containerHeight: number) {
      const margin = 20;
      const width = containerWidth;
      const height = containerHeight;
      const radius = Math.min(width, height) / 2 - margin;

      const svg = d3.select(winRatesSvgRef.current);
      svg.selectAll('*').remove();

      const g = svg
        .attr('width', containerWidth)
        .attr('height', containerHeight)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

      // Pie layout
      const pie = d3.pie<any>()
        .value(d => d.value)
        .sort(null);

      // Arc generator for Donut
      const arc = d3.arc<any>()
        .innerRadius(radius * 0.6)
        .outerRadius(radius);

      // Arc for hover effect
      const hoverArc = d3.arc<any>()
        .innerRadius(radius * 0.55)
        .outerRadius(radius * 1.05);

      const pieData = pie(matchRatios);

      // Render donut slices
      const path = g.selectAll('path')
        .data(pieData)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => d.data.color)
        .attr('stroke', '#050811')
        .style('stroke-width', '4px')
        .style('cursor', 'pointer')
        .each(function(d) { (this as any)._current = d; }); // Store initial angles

      // Interactive hover transition
      path.on('mouseover', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', hoverArc);

        const bounds = winRatesContainerRef.current?.getBoundingClientRect();
        setTooltipContent({
          visible: true,
          x: event.clientX - (bounds?.left || 0) + 15,
          y: event.clientY - (bounds?.top || 0) - 50,
          title: d.data.label,
          items: [
            { label: 'Matches', value: `${d.data.value} matches` },
            { label: 'Percentage', value: `${d.data.percentage}%` }
          ]
        });
      })
      .on('mouseout', function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc);

        setTooltipContent(prev => ({ ...prev, visible: false }));
      });

      // Animated entry transition
      path.transition()
        .duration(1000)
        .attrTween('d', function(d) {
          const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
          return function(t) {
            return arc(interpolate(t)) || '';
          };
        });

      // Central tactical text inside the donut
      const totalMatches = d3.sum(matchRatios, (d: any) => d.value);
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.2em')
        .attr('class', 'font-mono text-slate-500 uppercase tracking-widest text-[8px] font-black')
        .text('TOTAL SAMPLES');

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.8em')
        .attr('class', 'text-white text-2xl font-black italic tracking-tighter')
        .text(totalMatches);
    }
  }, [matchRatios]);

  // --- D3.JS CHART 3: PLAYER METRIC DISTRIBUTION (BAR/HISTOGRAM) ---
  // Select active metrics dynamically based on the tab
  const activeMetricsData = useMemo(() => {
    return LOCAL_PLAYER_METRICS.map(p => ({
      name: p.name,
      position: p.position,
      value: activeMetricTab === 'rating' ? p.rating : (activeMetricTab === 'passing' ? p.passingAccuracy : p.sprintSpeed),
      unit: activeMetricTab === 'rating' ? '/10' : (activeMetricTab === 'passing' ? '%' : ' km/h')
    })).sort((a, b) => b.value - a.value);
  }, [activeMetricTab]);

  useEffect(() => {
    if (!playerContainerRef.current || !playerSvgRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      renderPlayerDistribution(width, height || 280);
    });

    resizeObserver.observe(playerContainerRef.current);
    const initialWidth = playerContainerRef.current.clientWidth;
    renderPlayerDistribution(initialWidth, 280);

    return () => resizeObserver.disconnect();

    function renderPlayerDistribution(containerWidth: number, containerHeight: number) {
      const margin = { top: 15, right: 20, bottom: 40, left: 110 };
      const width = containerWidth - margin.left - margin.right;
      const height = containerHeight - margin.top - margin.bottom;

      const svg = d3.select(playerSvgRef.current);
      svg.selectAll('*').remove();

      const g = svg
        .attr('width', containerWidth)
        .attr('height', containerHeight)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      // Slices to top 10 players to fit screen perfectly
      const topPlayers = activeMetricsData.slice(0, 10);

      // Scales
      const yScale = d3.scaleBand()
        .domain(topPlayers.map((d: any) => d.name))
        .range([0, height])
        .padding(0.25);

      const maxValue = d3.max(topPlayers, (d: any) => d.value) || 10;
      const xScale = d3.scaleLinear()
        .domain([0, activeMetricTab === 'rating' ? 10 : (activeMetricTab === 'passing' ? 100 : 40)])
        .range([0, width]);

      // Color mapper based on positions
      const posColors: Record<string, string> = {
        'GK': '#eab308', // gold/yellow
        'DEF': '#10b981', // emerald/green
        'MID': '#3b82f6', // blue/cyan
        'FWD': '#f43f5e'  // rose/pink
      };

      // X Grid
      const xGrid = d3.axisBottom(xScale)
        .ticks(5)
        .tickSize(-height)
        .tickFormat(() => '');

      g.append('g')
        .attr('class', 'text-zinc-800 opacity-20')
        .attr('transform', `translate(0, ${height})`)
        .call(xGrid);

      // Render Horizontal Bars
      const bars = g.selectAll('rect')
        .data(topPlayers)
        .enter()
        .append('rect')
        .attr('y', (d: any) => yScale(d.name) || 0)
        .attr('x', 0)
        .attr('height', yScale.bandwidth())
        .attr('fill', (d: any) => posColors[d.position] || '#ffffff')
        .attr('rx', 3)
        .style('cursor', 'pointer')
        .attr('width', 0); // Start at 0 for entrance animation

      // Entrance animation
      bars.transition()
        .duration(800)
        .attr('width', (d: any) => xScale(d.value));

      // Bar Hovers
      bars.on('mouseover', function (event, d: any) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('opacity', 0.8);

        const bounds = playerContainerRef.current?.getBoundingClientRect();
        setTooltipContent({
          visible: true,
          x: event.clientX - (bounds?.left || 0) + 15,
          y: event.clientY - (bounds?.top || 0) - 50,
          title: d.name,
          items: [
            { label: 'Role Position', value: d.position },
            { label: 'Tactical Metric', value: `${d.value}${d.unit}` }
          ]
        });
      })
      .on('mouseout', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('opacity', 1);

        setTooltipContent(prev => ({ ...prev, visible: false }));
      });

      // Y Axis Labeling
      g.append('g')
        .attr('class', 'font-mono text-[9px] text-zinc-500')
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .style('fill', '#e2e8f0')
        .style('font-weight', 'black')
        .style('letter-spacing', '0.05em')
        .text((d: any) => d.toUpperCase());

      // X Axis
      g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .attr('class', 'font-mono text-[8px] text-zinc-500')
        .call(d3.axisBottom(xScale).ticks(5))
        .selectAll('text')
        .style('fill', '#94a3b8');

      // Add text label values on end of bars
      g.selectAll('.bar-label')
        .data(topPlayers)
        .enter()
        .append('text')
        .attr('class', 'bar-label font-mono text-[8px] font-black')
        .attr('x', (d: any) => xScale(d.value) + 5)
        .attr('y', (d: any) => (yScale(d.name) || 0) + yScale.bandwidth() / 2 + 3)
        .style('fill', '#cbd5e1')
        .text((d: any) => `${d.value}${d.unit}`);
    }
  }, [activeMetricsData, activeMetricTab]);

  return (
    <div className="space-y-6">
      {/* Overview Greeting */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-2xl rounded-full" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Performance Analytics Deck</h2>
          </div>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-widest max-w-xl">
            Pure D3.js telemetry dashboard representing tactical metrics, drive archives, and live tournament simulations.
          </p>
        </div>

        {/* Sync Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {hasGmailAccess ? (
            <>
              <button 
                onClick={fetchDriveMatches}
                disabled={isScanning}
                className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl font-mono text-[10px] font-black uppercase tracking-widest hover:bg-white/10 text-white transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                Scan Workspace
              </button>
              <button 
                onClick={handleAutogenerateReports}
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-3 bg-blue-600/15 border border-blue-500/20 rounded-xl font-mono text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/30 text-blue-400 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isGenerating ? "Injecting..." : "Seed Drive"}
              </button>
            </>
          ) : (
            <button 
              onClick={handleConnect}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-mono text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-500 hover:scale-105 transition-all shadow-[0_0_20px_rgba(37,99,235,0.25)]"
            >
              <HardDrive className="w-4 h-4" />
              Unlock Drive Analytics
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Filter Controls Panel */}
      <div className="bg-black/40 border border-white/5 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Source Filter */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest block">Data Source</label>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setSelectedSource('ALL')}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-mono font-black uppercase transition-all ${selectedSource === 'ALL' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
            >
              ALL
            </button>
            <button 
              onClick={() => setSelectedSource('DRIVE')}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-mono font-black uppercase transition-all ${selectedSource === 'DRIVE' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
            >
              Drive
            </button>
            <button 
              onClick={() => setSelectedSource('VAULT')}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-mono font-black uppercase transition-all ${selectedSource === 'VAULT' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
            >
              Vault
            </button>
          </div>
        </div>

        {/* Home Team Filter */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest block">Filter Team Focus</label>
          <select
            value={selectedHomeTeam}
            onChange={(e) => setSelectedHomeTeam(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-3 text-[10px] font-mono font-black text-white outline-none cursor-pointer focus:border-amber-500/40 uppercase"
          >
            <option value="ALL" className="bg-[#050811]">SHOW ALL TEAMS</option>
            {uniqueTeams.map(t => (
              <option key={t} value={t} className="bg-[#050811]">{t.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Workspace Connection Info Banner */}
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/40 border border-white/5 rounded-xl">
          <Info className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono font-black text-white uppercase tracking-wider block">Drive Parser State</span>
            <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">
              {hasGmailAccess ? `ONLINE - ${driveMatches.length} FILES EXTRAPOLATED` : 'OFFLINE - Caching Simulated Core'}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Dashboard Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Match score historical trends */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/10 rounded-3xl p-5 relative min-h-[360px] flex flex-col justify-between">
          <div className="space-y-1 mb-4">
            <h3 className="text-xs font-mono font-black text-white uppercase tracking-widest">Historical Performance Trends</h3>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Goals Scored (Solid Blue) vs Goals Conceded (Dashed Red)</span>
          </div>

          {allMatches.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-40">
              <CloudLightning className="w-8 h-8 text-slate-500 mb-2" />
              <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">No matching matches found</span>
            </div>
          ) : (
            <div ref={trendsContainerRef} className="flex-1 w-full relative">
              <svg ref={trendsSvgRef} className="w-full h-[300px]" />
            </div>
          )}
        </div>

        {/* Chart 2: Win rates donut */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 flex flex-col justify-between min-h-[360px]">
          <div className="space-y-1 mb-4">
            <h3 className="text-xs font-mono font-black text-white uppercase tracking-widest">Tactical Match Ratios</h3>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Win, draw, and loss shares</span>
          </div>

          <div ref={winRatesContainerRef} className="flex-1 w-full flex items-center justify-center relative">
            <svg ref={winRatesSvgRef} className="w-full h-[250px]" />
          </div>

          {/* Simple Legend */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
            {matchRatios.map(item => (
              <div key={item.label} className="text-center">
                <span className="text-[9px] font-mono font-black text-slate-500 block uppercase">{item.label}</span>
                <span className="text-xs font-mono font-black text-white" style={{ color: item.color }}>
                  {item.value} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Secondary Row: Player performance distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 3: Player Distribution */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/10 rounded-3xl p-5 relative min-h-[350px] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="space-y-1">
              <h3 className="text-xs font-mono font-black text-white uppercase tracking-widest">Squad Distribution Core</h3>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Highlighting top 10 players based on telemetry values</span>
            </div>

            {/* Metric Tab Selectors */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 shrink-0 self-end">
              <button 
                onClick={() => setActiveMetricTab('rating')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-black uppercase transition-all ${activeMetricTab === 'rating' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
              >
                Rating
              </button>
              <button 
                onClick={() => setActiveMetricTab('passing')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-black uppercase transition-all ${activeMetricTab === 'passing' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
              >
                Passing %
              </button>
              <button 
                onClick={() => setActiveMetricTab('speed')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-black uppercase transition-all ${activeMetricTab === 'speed' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
              >
                Speed
              </button>
            </div>
          </div>

          <div ref={playerContainerRef} className="flex-1 w-full relative">
            <svg ref={playerSvgRef} className="w-full h-[280px]" />
          </div>

          {/* Color coding guides */}
          <div className="flex items-center gap-4 pt-3 border-t border-white/5 justify-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f43f5e]" />
              <span className="text-[9px] font-mono font-black text-slate-500">FWD</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
              <span className="text-[9px] font-mono font-black text-slate-500">MID</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span className="text-[9px] font-mono font-black text-slate-500">DEF</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#eab308]" />
              <span className="text-[9px] font-mono font-black text-slate-500">GK</span>
            </div>
          </div>
        </div>

        {/* Scouting Document Feed Summary (connecting Docs explicitly) */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 flex flex-col justify-between">
          <div className="space-y-1 mb-4">
            <h3 className="text-xs font-mono font-black text-white uppercase tracking-widest">Archived Document Log</h3>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Parsed metadata logs from My Docs</span>
          </div>

          {driveFiles.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
              <HardDrive className="w-8 h-8 text-slate-700 mb-3" />
              <span className="text-[10px] font-mono font-black text-white uppercase block mb-1">Drive Archive Disconnected</span>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-relaxed">
                Connect your Workspace using the top panel to sync and extract live reports dynamically.
              </p>
            </div>
          ) : (
            <div className="flex-1 space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {driveFiles.slice(0, 5).map((file, idx) => (
                <div 
                  key={file.id || idx}
                  className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-amber-500/20 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-black text-white uppercase truncate block group-hover:text-amber-400 transition-colors">
                        {file.name}
                      </span>
                      <span className="text-[8px] font-mono text-slate-500 block">
                        CREATED: {file.createdTime ? new Date(file.createdTime).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-500 transition-colors" />
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-white/5 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
              Hover over D3 chart elements for localized telemetry readings.
            </span>
          </div>
        </div>

      </div>

      {/* State-controlled Overlay Tooltip (Dynamic, styled pixel-perfect overlay) */}
      <AnimatePresence>
        {tooltipContent.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute z-50 bg-[#0c1020]/95 border border-white/20 p-4 rounded-xl shadow-2xl pointer-events-none min-w-[180px]"
            style={{
              left: tooltipContent.x,
              top: tooltipContent.y,
            }}
          >
            <h4 className="font-mono text-[10px] font-black text-amber-500 uppercase tracking-wider border-b border-white/10 pb-1.5 mb-2">
              {tooltipContent.title.toUpperCase()}
            </h4>
            <div className="space-y-1">
              {tooltipContent.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-slate-400 uppercase tracking-widest">{item.label}:</span>
                  <span className={`font-black uppercase tracking-wider ${item.color || 'text-white'}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
