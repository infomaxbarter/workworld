import { useEffect, useMemo, useRef } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';

interface NetworkGraphProps {
  profiles: any[];
  anon: any[];
  events: any[];
  professions: any[];
  profileProfessions: Map<string, string[]>;
  anonProfessions: Map<string, string[]>;
  onSelect?: (type: string, id: string, lat?: number, lng?: number) => void;
  height?: number;
}

/**
 * Cytoscape.js network graph:
 *  - Country nodes group their cities/entities.
 *  - Profession nodes connect to people who have that profession.
 *  - Events connect to their country.
 * Efficient: elements memoized, single Cytoscape instance, incremental replace via cy.json().
 */
const NetworkGraph = ({
  profiles, anon, events, professions,
  profileProfessions, anonProfessions,
  onSelect, height = 340,
}: NetworkGraphProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);

  const elements = useMemo<ElementDefinition[]>(() => {
    const els: ElementDefinition[] = [];
    const countrySet = new Set<string>();
    const addCountry = (c?: string) => {
      if (!c) return;
      if (!countrySet.has(c)) {
        countrySet.add(c);
        els.push({ data: { id: `c:${c}`, label: c, kind: 'country' } });
      }
    };

    professions.forEach((p) => {
      const name = p.name_i18n?.en || p.name || 'Profession';
      els.push({ data: { id: `pr:${p.id}`, label: `💼 ${name}`, kind: 'profession', lat: p.lat, lng: p.lng, ref: p.id } });
      addCountry(p.country_code || p.country);
      if (p.country) els.push({ data: { source: `pr:${p.id}`, target: `c:${p.country}` } });
    });

    profiles.forEach((p) => {
      addCountry(p.country);
      els.push({ data: { id: `p:${p.id}`, label: `👤 ${p.display_name || 'User'}`, kind: 'profile', lat: p.lat, lng: p.lng, ref: p.id } });
      if (p.country) els.push({ data: { source: `p:${p.id}`, target: `c:${p.country}` } });
      (profileProfessions.get(p.id) || []).forEach((prid) => {
        els.push({ data: { source: `p:${p.id}`, target: `pr:${prid}` } });
      });
    });

    anon.forEach((u) => {
      addCountry(u.country);
      const name = u.name_i18n?.en || u.name || 'Member';
      els.push({ data: { id: `a:${u.id}`, label: `👻 ${name}`, kind: 'anon', lat: u.lat, lng: u.lng, ref: u.id } });
      if (u.country) els.push({ data: { source: `a:${u.id}`, target: `c:${u.country}` } });
      (anonProfessions.get(u.id) || []).forEach((prid) => {
        els.push({ data: { source: `a:${u.id}`, target: `pr:${prid}` } });
      });
    });

    events.forEach((e) => {
      addCountry(e.country);
      const t = e.title_i18n?.en || e.title || 'Event';
      els.push({ data: { id: `e:${e.id}`, label: `📅 ${t}`, kind: 'event', lat: e.lat, lng: e.lng, ref: e.id } });
      if (e.country) els.push({ data: { source: `e:${e.id}`, target: `c:${e.country}` } });
    });

    return els;
  }, [profiles, anon, events, professions, profileProfessions, anonProfessions]);

  // Create once
  useEffect(() => {
    if (!containerRef.current || cyRef.current) return;
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [],
      wheelSensitivity: 0.2,
      style: [
        { selector: 'node', style: {
          label: 'data(label)', 'font-size': 9, color: 'hsl(215.4 16.3% 46.9%)',
          'text-valign': 'bottom', 'text-margin-y': 4, 'text-wrap': 'ellipsis', 'text-max-width': 90,
          width: 18, height: 18, 'background-color': '#94a3b8', 'border-width': 1, 'border-color': '#fff',
        }},
        { selector: 'node[kind="country"]', style: { 'background-color': 'hsl(152 60% 36%)', width: 30, height: 30, 'font-weight': 700, 'font-size': 11 }},
        { selector: 'node[kind="profession"]', style: { 'background-color': '#f97316', shape: 'diamond' }},
        { selector: 'node[kind="event"]', style: { 'background-color': '#22c55e', shape: 'triangle' }},
        { selector: 'node[kind="profile"]', style: { 'background-color': 'hsl(152 60% 36%)' }},
        { selector: 'node[kind="anon"]', style: { 'background-color': '#94a3b8' }},
        { selector: 'edge', style: { width: 1, 'line-color': 'hsl(214.3 31.8% 91.4%)', 'curve-style': 'bezier', opacity: 0.6 }},
        { selector: 'node:selected', style: { 'border-width': 3, 'border-color': 'hsl(152 60% 36%)' }},
      ],
    });
    cyRef.current.on('tap', 'node', (evt) => {
      const d = evt.target.data();
      const kind = d.kind === 'profile' ? 'profile' : d.kind === 'anon' ? 'anon' : d.kind === 'event' ? 'event' : d.kind === 'profession' ? 'profession' : 'country';
      onSelect?.(kind, d.ref || d.id, d.lat, d.lng);
    });
    return () => { cyRef.current?.destroy(); cyRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update elements + layout when data changes
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      cy.elements().remove();
      cy.add(elements);
    });
    cy.layout({ name: 'cose', animate: false, nodeRepulsion: () => 4500, idealEdgeLength: () => 60, padding: 20 } as any).run();
    cy.fit(undefined, 20);
  }, [elements]);

  return <div ref={containerRef} style={{ width: '100%', height }} className="rounded-lg border border-border bg-background" />;
};

export default NetworkGraph;
