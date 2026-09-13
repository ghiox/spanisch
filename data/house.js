'use strict';
/* La casa - Post-it-Modus: Raeume als flache SVG-Szenen, jedes Objekt traegt data-item.
   Farben sind fest und mitteltonig, damit die Szene in Hell- und Dunkelmodus lesbar bleibt.
   Genus/Wortwahl = Standard Spanien: la sarten (in Teilen Lateinamerikas el sarten),
   el vater, la nevera, el grifo, la mesilla de noche. */

var HOUSE_OVERVIEW =
'<svg viewBox="0 0 800 520" font-family="system-ui, sans-serif" stroke="#4a4038" stroke-width="2.5" stroke-linejoin="round">' +
  '<rect width="800" height="520" fill="#cfe0e6" stroke="none"/>' +
  '<rect y="468" width="800" height="52" fill="#8d9b6a" stroke="none"/>' +
  '<rect x="620" y="46" width="46" height="70" rx="4" fill="#8f4438"/>' +
  '<path d="M400 26 780 172 20 172z" fill="#b2493a"/>' +
  '<rect x="60" y="168" width="680" height="302" rx="4" fill="#e8dfd0"/>' +
  '<path d="M60 322h680" stroke-width="3"/>' +
  '<g data-room="dormitorio">' +
    '<rect class="rm" x="70" y="178" width="330" height="136" rx="6" fill="#f5eee1"/>' +
    '<text x="235" y="238" text-anchor="middle" font-size="26" font-weight="700" fill="#4a4038" stroke="none">el dormitorio</text>' +
    '<text x="235" y="264" text-anchor="middle" font-size="15" fill="#7a6f60" stroke="none">Schlafzimmer</text>' +
  '</g>' +
  '<g data-room="bano">' +
    '<rect class="rm" x="408" y="178" width="322" height="136" rx="6" fill="#e7eeec"/>' +
    '<text x="569" y="238" text-anchor="middle" font-size="26" font-weight="700" fill="#4a4038" stroke="none">el baño</text>' +
    '<text x="569" y="264" text-anchor="middle" font-size="15" fill="#7a6f60" stroke="none">Bad</text>' +
  '</g>' +
  '<g data-room="cocina">' +
    '<rect class="rm" x="70" y="330" width="216" height="132" rx="6" fill="#f5eee1"/>' +
    '<text x="178" y="386" text-anchor="middle" font-size="22" font-weight="700" fill="#4a4038" stroke="none">la cocina</text>' +
    '<text x="178" y="410" text-anchor="middle" font-size="14" fill="#7a6f60" stroke="none">Küche</text>' +
  '</g>' +
  '<g data-room="salon">' +
    '<rect class="rm" x="294" y="330" width="216" height="132" rx="6" fill="#f5eee1"/>' +
    '<text x="402" y="386" text-anchor="middle" font-size="22" font-weight="700" fill="#4a4038" stroke="none">el salón</text>' +
    '<text x="402" y="410" text-anchor="middle" font-size="14" fill="#7a6f60" stroke="none">Wohnzimmer</text>' +
  '</g>' +
  '<g data-room="entrada">' +
    '<rect class="rm" x="518" y="330" width="212" height="132" rx="6" fill="#f5eee1"/>' +
    '<text x="624" y="386" text-anchor="middle" font-size="22" font-weight="700" fill="#4a4038" stroke="none">la entrada</text>' +
    '<text x="624" y="410" text-anchor="middle" font-size="14" fill="#7a6f60" stroke="none">Eingang</text>' +
  '</g>' +
'</svg>';

var HOUSE = [
{
  id: 'cocina', es: 'la cocina', de: 'die Küche',
  items: [
    { id: 'nevera', es: 'la nevera', de: 'der Kühlschrank' },
    { id: 'horno', es: 'el horno', de: 'der Backofen' },
    { id: 'lavadora', es: 'la lavadora', de: 'die Waschmaschine' },
    { id: 'fregadero', es: 'el fregadero', de: 'die Spüle' },
    { id: 'sarten', es: 'la sartén', de: 'die Pfanne' },
    { id: 'microondas', es: 'el microondas', de: 'die Mikrowelle' },
    { id: 'vaso', es: 'el vaso', de: 'das Glas' },
    { id: 'taza', es: 'la taza', de: 'die Tasse' },
    { id: 'mesa', es: 'la mesa', de: 'der Tisch' },
    { id: 'silla', es: 'la silla', de: 'der Stuhl' },
    { id: 'plato', es: 'el plato', de: 'der Teller' },
    { id: 'tenedor', es: 'el tenedor', de: 'die Gabel' },
    { id: 'cuchillo', es: 'el cuchillo', de: 'das Messer' },
    { id: 'cuchara', es: 'la cuchara', de: 'der Löffel' }
  ],
  svg:
  '<svg viewBox="0 0 800 520" font-family="system-ui, sans-serif" stroke="#4a4038" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">' +
    '<rect width="800" height="520" fill="#d8cfc2" stroke="none"/>' +
    '<rect y="380" width="800" height="140" fill="#b9a58c" stroke="none"/>' +
    '<rect y="374" width="800" height="8" fill="#8a7660" stroke="none"/>' +
    '<rect x="160" y="290" width="325" height="16" rx="4" fill="#8f7d64"/>' +
    '<rect x="165" y="306" width="315" height="70" fill="#c9b18d"/>' +
    '<rect x="180" y="198" width="290" height="10" rx="3" fill="#8f7d64"/>' +
    '<g data-item="nevera">' +
      '<rect x="30" y="105" width="115" height="270" rx="8" fill="#eceae4"/>' +
      '<path d="M30 215h115"/>' +
      '<rect x="118" y="152" width="9" height="46" rx="4" fill="#9aa3a8"/>' +
      '<rect x="118" y="234" width="9" height="46" rx="4" fill="#9aa3a8"/>' +
    '</g>' +
    '<g data-item="horno">' +
      '<rect x="185" y="312" width="95" height="62" rx="5" fill="#d9d5cd"/>' +
      '<rect x="194" y="318" width="77" height="8" rx="4" fill="#a9a49b"/>' +
      '<rect x="194" y="332" width="77" height="34" rx="3" fill="#4c4a48"/>' +
    '</g>' +
    '<g data-item="lavadora">' +
      '<rect x="295" y="312" width="95" height="62" rx="5" fill="#f0eee9"/>' +
      '<rect x="303" y="318" width="79" height="8" rx="4" fill="#dcd7cf"/>' +
      '<circle cx="343" cy="350" r="19" fill="#bcd0d4"/>' +
      '<circle cx="343" cy="350" r="10" fill="#8fa9b0" stroke="none"/>' +
    '</g>' +
    '<g data-item="fregadero">' +
      '<path d="M418 284V250q0-10 10-10h22" fill="none" stroke-width="5"/>' +
      '<path d="M450 240v12" stroke-width="5"/>' +
      '<rect x="396" y="282" width="80" height="24" rx="4" fill="#c3ccd0"/>' +
      '<rect x="404" y="288" width="64" height="16" rx="3" fill="#8b999f"/>' +
      '<circle cx="436" cy="296" r="4" fill="#6f7d83" stroke="none"/>' +
    '</g>' +
    '<g data-item="sarten">' +
      '<path d="M196 268h76l-7 16a10 10 0 0 1-9 6h-44a10 10 0 0 1-9-6z" fill="#4f4b48"/>' +
      '<rect x="271" y="268" width="58" height="9" rx="4" fill="#6b4a2e"/>' +
    '</g>' +
    '<g data-item="microondas">' +
      '<rect x="300" y="140" width="132" height="58" rx="5" fill="#e6e3dd"/>' +
      '<rect x="308" y="148" width="84" height="42" rx="3" fill="#4c4a48"/>' +
      '<circle cx="412" cy="160" r="7" fill="#b7b1a7"/>' +
      '<rect x="401" y="176" width="22" height="7" rx="3" fill="#b7b1a7"/>' +
    '</g>' +
    '<g data-item="vaso">' +
      '<path d="M196 154h34l-4 44h-26z" fill="#cfe0e6"/>' +
    '</g>' +
    '<g data-item="taza">' +
      '<path d="M246 162h38v28a8 8 0 0 1-8 8h-22a8 8 0 0 1-8-8z" fill="#e8dcd0"/>' +
      '<path d="M284 170h8a10 10 0 0 1 0 20h-8" fill="none"/>' +
    '</g>' +
    '<g data-item="silla">' +
      '<rect x="494" y="244" width="34" height="11" rx="5" fill="#8a5d38"/>' +
      '<rect x="498" y="255" width="26" height="78" rx="4" fill="#b98a58"/>' +
      '<path d="M511 258v72" stroke-width="2"/>' +
      '<rect x="496" y="330" width="74" height="12" rx="3" fill="#a9764a"/>' +
      '<rect x="500" y="342" width="11" height="34" fill="#8a5d38"/>' +
      '<rect x="556" y="342" width="11" height="34" fill="#8a5d38"/>' +
    '</g>' +
    '<g data-item="mesa">' +
      '<rect x="560" y="294" width="216" height="14" rx="4" fill="#a9764a"/>' +
      '<rect x="574" y="308" width="13" height="68" fill="#8a5d38"/>' +
      '<rect x="749" y="308" width="13" height="68" fill="#8a5d38"/>' +
    '</g>' +
    '<g data-item="plato">' +
      '<ellipse cx="362" cy="286" rx="28" ry="9" fill="#f0ece4"/>' +
      '<ellipse cx="362" cy="285" rx="15" ry="4" fill="#ddd6ca" stroke="none"/>' +
    '</g>' +
    '<g data-item="tenedor">' +
      '<rect x="596" y="258" width="8" height="36" rx="4" fill="#c8ccd0"/>' +
      '<path d="M589 236v16a6 6 0 0 0 6 6h10a6 6 0 0 0 6-6v-16" fill="#c8ccd0"/>' +
      '<path d="M596 238v12M604 238v12" stroke-width="2"/>' +
    '</g>' +
    '<g data-item="cuchillo">' +
      '<path d="M656 270v-22q0-14 16-16v38z" fill="#d3d7da"/>' +
      '<rect x="656" y="270" width="16" height="24" rx="4" fill="#6b4a2e"/>' +
    '</g>' +
    '<g data-item="cuchara">' +
      '<ellipse cx="732" cy="250" rx="11" ry="15" fill="#c8ccd0"/>' +
      '<rect x="728" y="262" width="8" height="32" rx="4" fill="#c8ccd0"/>' +
    '</g>' +
  '</svg>'
},
{
  id: 'salon', es: 'el salón', de: 'das Wohnzimmer',
  items: [
    { id: 'sofa', es: 'el sofá', de: 'das Sofa' },
    { id: 'cojin', es: 'el cojín', de: 'das Kissen' },
    { id: 'sillon', es: 'el sillón', de: 'der Sessel' },
    { id: 'mesita', es: 'la mesita de centro', de: 'der Couchtisch' },
    { id: 'libro', es: 'el libro', de: 'das Buch' },
    { id: 'televisor', es: 'el televisor', de: 'der Fernseher' },
    { id: 'lampara', es: 'la lámpara', de: 'die Lampe' },
    { id: 'alfombra', es: 'la alfombra', de: 'der Teppich' },
    { id: 'cuadro', es: 'el cuadro', de: 'das Bild' },
    { id: 'estanteria', es: 'la estantería', de: 'das Regal' },
    { id: 'planta', es: 'la planta', de: 'die Pflanze' },
    { id: 'ventana', es: 'la ventana', de: 'das Fenster' },
    { id: 'cortina', es: 'la cortina', de: 'der Vorhang' }
  ],
  svg:
  '<svg viewBox="0 0 800 520" font-family="system-ui, sans-serif" stroke="#4a4038" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">' +
    '<rect width="800" height="520" fill="#d8cfc2" stroke="none"/>' +
    '<rect y="380" width="800" height="140" fill="#b9a58c" stroke="none"/>' +
    '<rect y="374" width="800" height="8" fill="#8a7660" stroke="none"/>' +
    '<g data-item="cuadro">' +
      '<rect x="55" y="60" width="110" height="95" rx="4" fill="#e6ddc9"/>' +
      '<rect x="65" y="70" width="90" height="75" fill="#7fa8a0" stroke="none"/>' +
      '<path d="M65 128l24-26 18 20 14-12 34 25v10H65z" fill="#4e7d76" stroke="none"/>' +
      '<circle cx="132" cy="88" r="8" fill="#e8c45c" stroke="none"/>' +
    '</g>' +
    '<g data-item="televisor">' +
      '<rect x="200" y="65" width="190" height="118" rx="6" fill="#2f3238"/>' +
      '<rect x="209" y="74" width="172" height="92" rx="3" fill="#5a7f96" stroke="none"/>' +
      '<circle cx="295" cy="175" r="4" fill="#8fa9b0" stroke="none"/>' +
    '</g>' +
    '<g data-item="ventana">' +
      '<rect x="430" y="55" width="130" height="135" rx="4" fill="#bcd8e6"/>' +
      '<path d="M495 55v135M430 122h130" stroke-width="4"/>' +
      '<circle cx="462" cy="88" r="13" fill="#f2e08a" stroke="none"/>' +
    '</g>' +
    '<g data-item="cortina">' +
      '<rect x="398" y="40" width="194" height="10" rx="5" fill="#8a5d38"/>' +
      '<rect x="404" y="46" width="28" height="162" rx="8" fill="#c4795e"/>' +
      '<rect x="558" y="46" width="28" height="162" rx="8" fill="#c4795e"/>' +
      '<path d="M418 54v146M572 54v146" stroke-width="2" stroke="#a45f47"/>' +
    '</g>' +
    '<g data-item="estanteria">' +
      '<rect x="620" y="60" width="160" height="140" rx="4" fill="#c69a63"/>' +
      '<rect x="628" y="68" width="144" height="56" fill="#e0d3bd" stroke="none"/>' +
      '<rect x="628" y="132" width="144" height="60" fill="#e0d3bd" stroke="none"/>' +
      '<g stroke="none">' +
        '<rect x="636" y="76" width="12" height="48" fill="#b2493a"/>' +
        '<rect x="651" y="82" width="11" height="42" fill="#3f6f93"/>' +
        '<rect x="665" y="78" width="13" height="46" fill="#5f8a52"/>' +
        '<rect x="681" y="86" width="10" height="38" fill="#c9863f"/>' +
        '<rect x="700" y="140" width="12" height="52" fill="#7a5ea8"/>' +
        '<rect x="715" y="146" width="11" height="46" fill="#b2493a"/>' +
        '<rect x="729" y="138" width="13" height="54" fill="#3f6f93"/>' +
        '<rect x="636" y="176" width="52" height="8" fill="#c9863f"/>' +
        '<rect x="638" y="166" width="48" height="8" fill="#5f8a52"/>' +
      '</g>' +
    '</g>' +
    '<g data-item="lampara">' +
      '<path d="M52 200h76l16 52H36z" fill="#e8c45c"/>' +
      '<rect x="86" y="252" width="8" height="114" fill="#8a7660"/>' +
      '<ellipse cx="90" cy="368" rx="34" ry="9" fill="#8a7660"/>' +
    '</g>' +
    '<g data-item="sofa">' +
      '<rect x="150" y="250" width="270" height="80" rx="16" fill="#6d8ab0"/>' +
      '<rect x="160" y="298" width="250" height="44" rx="10" fill="#7d99bd"/>' +
      '<rect x="146" y="284" width="34" height="60" rx="12" fill="#5f7ba0"/>' +
      '<rect x="390" y="284" width="34" height="60" rx="12" fill="#5f7ba0"/>' +
      '<rect x="168" y="342" width="12" height="32" fill="#6b4a2e"/>' +
      '<rect x="390" y="342" width="12" height="32" fill="#6b4a2e"/>' +
      '<path d="M285 300v40" stroke-width="2"/>' +
    '</g>' +
    '<g data-item="cojin" transform="rotate(-9 222 300)">' +
      '<rect x="192" y="272" width="60" height="56" rx="10" fill="#d9b44a"/>' +
    '</g>' +
    '<g data-item="mesita">' +
      '<rect x="445" y="320" width="132" height="13" rx="3" fill="#a9764a"/>' +
      '<rect x="456" y="333" width="10" height="43" fill="#8a5d38"/>' +
      '<rect x="556" y="333" width="10" height="43" fill="#8a5d38"/>' +
    '</g>' +
    '<g data-item="libro" transform="rotate(-4 498 312)">' +
      '<rect x="470" y="304" width="58" height="16" rx="2" fill="#b2493a"/>' +
      '<path d="M470 313h58" stroke-width="2"/>' +
    '</g>' +
    '<g data-item="sillon">' +
      '<rect x="580" y="256" width="130" height="74" rx="14" fill="#8d9b6a"/>' +
      '<rect x="588" y="298" width="114" height="44" rx="10" fill="#9dab7a"/>' +
      '<rect x="576" y="286" width="30" height="56" rx="11" fill="#7d8b5c"/>' +
      '<rect x="686" y="286" width="30" height="56" rx="11" fill="#7d8b5c"/>' +
      '<rect x="592" y="342" width="11" height="32" fill="#6b4a2e"/>' +
      '<rect x="690" y="342" width="11" height="32" fill="#6b4a2e"/>' +
    '</g>' +
    '<g data-item="planta">' +
      '<path d="M762 330V266" stroke-width="4"/>' +
      '<ellipse cx="744" cy="290" rx="20" ry="11" fill="#5f8a52" transform="rotate(-25 744 290)"/>' +
      '<ellipse cx="782" cy="280" rx="20" ry="11" fill="#4e7544" transform="rotate(25 782 280)"/>' +
      '<ellipse cx="756" cy="256" rx="18" ry="10" fill="#5f8a52" transform="rotate(-10 756 256)"/>' +
      '<path d="M738 330h48l-6 46h-36z" fill="#c4795e"/>' +
    '</g>' +
    '<g data-item="alfombra">' +
      '<rect x="150" y="392" width="470" height="90" rx="12" fill="#b06a55"/>' +
      '<g stroke="none" fill="#c98977"><rect x="168" y="404" width="434" height="10"/><rect x="168" y="432" width="434" height="10"/><rect x="168" y="460" width="434" height="10"/></g>' +
      '<path d="M150 418h470" stroke="#95584a" stroke-width="2"/>' +
    '</g>' +
  '</svg>'
},
{
  id: 'dormitorio', es: 'el dormitorio', de: 'das Schlafzimmer',
  items: [
    { id: 'cama', es: 'la cama', de: 'das Bett' },
    { id: 'almohada', es: 'la almohada', de: 'das Kopfkissen' },
    { id: 'sabana', es: 'la sábana', de: 'das Bettlaken' },
    { id: 'manta', es: 'la manta', de: 'die Decke' },
    { id: 'mesilla', es: 'la mesilla de noche', de: 'der Nachttisch' },
    { id: 'despertador', es: 'el despertador', de: 'der Wecker' },
    { id: 'armario', es: 'el armario', de: 'der Kleiderschrank' },
    { id: 'maleta', es: 'la maleta', de: 'der Koffer' },
    { id: 'percha', es: 'la percha', de: 'der Kleiderbügel' },
    { id: 'camisa', es: 'la camisa', de: 'das Hemd' },
    { id: 'zapatos', es: 'los zapatos', de: 'die Schuhe' },
    { id: 'poster', es: 'el póster', de: 'das Poster' },
    { id: 'ventana', es: 'la ventana', de: 'das Fenster' }
  ],
  svg:
  '<svg viewBox="0 0 800 520" font-family="system-ui, sans-serif" stroke="#4a4038" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">' +
    '<rect width="800" height="520" fill="#d9d2c6" stroke="none"/>' +
    '<rect y="380" width="800" height="140" fill="#b08f6a" stroke="none"/>' +
    '<rect y="374" width="800" height="8" fill="#84674a" stroke="none"/>' +
    '<g data-item="ventana">' +
      '<rect x="40" y="62" width="132" height="126" rx="4" fill="#bcd8e6"/>' +
      '<path d="M106 62v126M40 125h132" stroke-width="4"/>' +
      '<circle cx="72" cy="94" r="12" fill="#f2e08a" stroke="none"/>' +
    '</g>' +
    '<g data-item="poster">' +
      '<rect x="222" y="62" width="168" height="116" rx="3" fill="#e8dcc6"/>' +
      '<circle cx="270" cy="104" r="21" fill="#d9b44a" stroke="none"/>' +
      '<path d="M230 170l40-46 30 30 26-24 56 40v0z" fill="#7fa8a0" stroke="none"/>' +
      '<path d="M230 170h152" stroke-width="2"/>' +
    '</g>' +
    '<g data-item="mesilla">' +
      '<rect x="36" y="296" width="76" height="80" rx="5" fill="#a9764a"/>' +
      '<rect x="44" y="306" width="60" height="26" rx="3" fill="#c08d5c"/>' +
      '<rect x="44" y="340" width="60" height="26" rx="3" fill="#c08d5c"/>' +
      '<path d="M64 319h20M64 353h20" stroke-width="3"/>' +
    '</g>' +
    '<g data-item="despertador">' +
      '<path d="M58 258l-9-9M90 258l9-9" stroke-width="4"/>' +
      '<circle cx="74" cy="276" r="20" fill="#d95f4a"/>' +
      '<circle cx="74" cy="276" r="13" fill="#f2ece0" stroke="none"/>' +
      '<path d="M74 268v9l7 4" fill="none" stroke-width="2.5"/>' +
      '<rect x="68" y="294" width="12" height="6" fill="#d95f4a"/>' +
    '</g>' +
    '<g data-item="cama">' +
      '<rect x="112" y="206" width="30" height="170" rx="6" fill="#8a5d38"/>' +
      '<rect x="446" y="284" width="24" height="92" rx="5" fill="#8a5d38"/>' +
      '<rect x="140" y="310" width="310" height="48" rx="4" fill="#a9764a"/>' +
      '<rect x="134" y="282" width="316" height="30" rx="8" fill="#f2efe7"/>' +
      '<rect x="152" y="358" width="14" height="18" fill="#6b4a2e"/>' +
      '<rect x="424" y="358" width="14" height="18" fill="#6b4a2e"/>' +
    '</g>' +
    '<g data-item="almohada">' +
      '<rect x="150" y="250" width="82" height="34" rx="14" fill="#fbf8f2"/>' +
    '</g>' +
    '<g data-item="sabana">' +
      '<path d="M244 284v-14q0-8 8-8h84q8 0 8 8v14z" fill="#fdfcf8"/>' +
      '<path d="M244 274h100" stroke-width="2"/>' +
    '</g>' +
    '<g data-item="manta">' +
      '<rect x="352" y="262" width="112" height="26" rx="7" fill="#7a92b8"/>' +
      '<rect x="436" y="286" width="30" height="66" rx="6" fill="#6c84aa"/>' +
    '</g>' +
    '<g data-item="percha">' +
      '<path d="M470 196h44l-22-16z" fill="none" stroke-width="4"/>' +
      '<path d="M492 180v-8a11 11 0 0 1 22 0" fill="none" stroke-width="4"/>' +
    '</g>' +
    '<g data-item="camisa">' +
      '<path d="M470 198l-18 14 10 22 14-10v70h44v-70l14 10 10-22-18-14-14 8h-28z" fill="#eef1ec"/>' +
      '<path d="M498 206v88" stroke-width="2"/>' +
    '</g>' +
    '<g data-item="zapatos">' +
      '<path d="M250 442v-26q0-10 10-10h12l8 14h22q10 0 10 10v12z" fill="#5b4636"/>' +
      '<path d="M250 432h62" stroke-width="2" stroke="#3d2e23"/>' +
      '<path d="M334 442v-26q0-10 10-10h12l8 14h22q10 0 10 10v12z" fill="#6b543f"/>' +
      '<path d="M334 432h62" stroke-width="2" stroke="#3d2e23"/>' +
    '</g>' +
    '<g data-item="maleta">' +
      '<rect x="608" y="96" width="104" height="44" rx="6" fill="#8a5a3c"/>' +
      '<path d="M608 118h104" stroke-width="2"/>' +
      '<path d="M646 96v-8a14 14 0 0 1 28 0v8" fill="none" stroke-width="4"/>' +
    '</g>' +
    '<g data-item="armario">' +
      '<rect x="560" y="140" width="200" height="236" rx="6" fill="#a9764a"/>' +
      '<rect x="572" y="152" width="76" height="212" rx="4" fill="#b98a58" stroke="none"/>' +
      '<rect x="672" y="152" width="76" height="212" rx="4" fill="#b98a58" stroke="none"/>' +
      '<path d="M660 140v236" stroke-width="3"/>' +
      '<circle cx="650" cy="258" r="6" fill="#f2ece0"/>' +
      '<circle cx="670" cy="258" r="6" fill="#f2ece0"/>' +
    '</g>' +
  '</svg>'
},
{
  id: 'bano', es: 'el baño', de: 'das Bad',
  items: [
    { id: 'ducha', es: 'la ducha', de: 'die Dusche' },
    { id: 'lavabo', es: 'el lavabo', de: 'das Waschbecken' },
    { id: 'grifo', es: 'el grifo', de: 'der Wasserhahn' },
    { id: 'espejo', es: 'el espejo', de: 'der Spiegel' },
    { id: 'cepillo', es: 'el cepillo de dientes', de: 'die Zahnbürste' },
    { id: 'pasta', es: 'la pasta de dientes', de: 'die Zahnpasta' },
    { id: 'jabon', es: 'el jabón', de: 'die Seife' },
    { id: 'papel', es: 'el papel higiénico', de: 'das Toilettenpapier' },
    { id: 'papelera', es: 'la papelera', de: 'der Papierkorb' },
    { id: 'toalla', es: 'la toalla', de: 'das Handtuch' },
    { id: 'bascula', es: 'la báscula', de: 'die Waage' },
    { id: 'vater', es: 'el váter', de: 'die Toilette' }
  ],
  svg:
  '<svg viewBox="0 0 800 520" font-family="system-ui, sans-serif" stroke="#4a4038" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">' +
    '<rect width="800" height="520" fill="#d3dcd9" stroke="none"/>' +
    '<rect y="380" width="800" height="140" fill="#a9b4b0" stroke="none"/>' +
    '<rect y="374" width="800" height="8" fill="#7e8a86" stroke="none"/>' +
    '<g stroke="#c3ccc9" stroke-width="2"><path d="M0 180h800M0 250h800M0 320h800M280 180v200M420 180v200M560 180v200M700 180v200"/></g>' +
    '<rect x="450" y="244" width="96" height="9" rx="3" fill="#b9c6c6"/>' +
    '<g data-item="ducha">' +
      '<rect x="30" y="100" width="205" height="274" rx="6" fill="#dbe8e8"/>' +
      '<path d="M150 100v274" stroke-width="3" stroke="#aebcbc"/>' +
      '<path d="M132 100v34" stroke-width="4"/>' +
      '<path d="M108 134h48l-8 18h-32z" fill="#9aa8ac"/>' +
      '<path d="M116 162v24M128 160v28M140 160v28M152 162v24" stroke-width="3" stroke="#7fa8b4"/>' +
      '<rect x="30" y="344" width="205" height="30" rx="6" fill="#b9c6c6"/>' +
    '</g>' +
    '<g data-item="espejo">' +
      '<rect x="300" y="84" width="116" height="124" rx="12" fill="#c8dcdc"/>' +
      '<rect x="310" y="94" width="96" height="104" rx="8" fill="#e4f0f0" stroke="none"/>' +
      '<path d="M320 178l38-56M344 186l30-44" stroke="#ffffff" stroke-width="7"/>' +
    '</g>' +
    '<g data-item="grifo">' +
      '<path d="M348 250v-20q0-10 10-10h16" fill="none" stroke-width="5"/>' +
      '<path d="M374 220v12" stroke-width="5"/>' +
      '<circle cx="348" cy="250" r="6" fill="#9aa8ac"/>' +
    '</g>' +
    '<g data-item="cepillo">' +
      '<rect x="298" y="212" width="10" height="40" rx="4" fill="#4a90c4"/>' +
      '<rect x="294" y="198" width="18" height="15" rx="4" fill="#f2f0ec"/>' +
      '<path d="M298 198v-6M303 198v-6M308 198v-6" stroke-width="2"/>' +
    '</g>' +
    '<g data-item="lavabo">' +
      '<rect x="288" y="248" width="132" height="46" rx="12" fill="#f0eeea"/>' +
      '<ellipse cx="354" cy="270" rx="50" ry="14" fill="#d8d5cf" stroke="none"/>' +
      '<ellipse cx="354" cy="270" rx="50" ry="14" fill="none" stroke="#a9b0ad" stroke-width="2"/>' +
      '<path d="M332 292h46l-7 84h-32z" fill="#f0eeea"/>' +
    '</g>' +
    '<g data-item="jabon">' +
      '<ellipse cx="408" cy="230" rx="11" ry="5" fill="#f7f2f4" stroke="none"/>' +
      '<rect x="390" y="232" width="36" height="18" rx="8" fill="#e9a3b4"/>' +
    '</g>' +
    '<g data-item="pasta">' +
      '<path d="M478 244v-34q0-8 8-8h12q8 0 8 8v34z" fill="#f0eeea"/>' +
      '<rect x="484" y="192" width="14" height="11" rx="3" fill="#3f7fb0"/>' +
      '<path d="M478 224h28" stroke-width="2"/>' +
    '</g>' +
    '<g data-item="papel">' +
      '<path d="M446 316h-10" stroke-width="4"/>' +
      '<circle cx="470" cy="316" r="24" fill="#f5f2ee"/>' +
      '<circle cx="470" cy="316" r="8" fill="#c9c2b8" stroke="none"/>' +
      '<path d="M494 316v30q0 6-6 6h-10v-36z" fill="#fbf9f6"/>' +
    '</g>' +
    '<g data-item="papelera">' +
      '<path d="M514 332h40l-6 44h-28z" fill="#b9c6c6"/>' +
      '<rect x="508" y="322" width="52" height="11" rx="5" fill="#9aa8ac"/>' +
    '</g>' +
    '<g data-item="toalla">' +
      '<rect x="558" y="196" width="100" height="9" rx="4" fill="#9aa8ac"/>' +
      '<path d="M574 205h68v118q0 6-6 6h-56q-6 0-6-6z" fill="#7fb0a8"/>' +
      '<path d="M574 234h68M574 296h68" stroke-width="2" stroke="#5f8f88"/>' +
    '</g>' +
    '<g data-item="bascula">' +
      '<rect x="570" y="348" width="80" height="28" rx="6" fill="#dcd9d3"/>' +
      '<circle cx="610" cy="362" r="10" fill="#f4f2ee"/>' +
      '<path d="M610 362l6-5" stroke-width="2"/>' +
    '</g>' +
    '<g data-item="vater">' +
      '<rect x="672" y="204" width="78" height="86" rx="6" fill="#f0eeea"/>' +
      '<rect x="700" y="212" width="22" height="10" rx="3" fill="#c6c2ba"/>' +
      '<path d="M660 288h108l-14 52q-4 14-20 14h-40q-16 0-20-14z" fill="#f0eeea"/>' +
      '<rect x="686" y="352" width="54" height="24" rx="5" fill="#e2ded6"/>' +
    '</g>' +
  '</svg>'
},
{
  id: 'entrada', es: 'la entrada', de: 'der Eingang / die Diele',
  items: [
    { id: 'puerta', es: 'la puerta', de: 'die Tür' },
    { id: 'llave', es: 'la llave', de: 'der Schlüssel' },
    { id: 'timbre', es: 'el timbre', de: 'die Klingel' },
    { id: 'interruptor', es: 'el interruptor', de: 'der Lichtschalter' },
    { id: 'felpudo', es: 'el felpudo', de: 'die Fußmatte' },
    { id: 'perchero', es: 'el perchero', de: 'die Garderobe' },
    { id: 'abrigo', es: 'el abrigo', de: 'der Mantel' },
    { id: 'bufanda', es: 'la bufanda', de: 'der Schal' },
    { id: 'paraguas', es: 'el paraguas', de: 'der Regenschirm' },
    { id: 'botas', es: 'las botas', de: 'die Stiefel' },
    { id: 'comoda', es: 'la cómoda', de: 'die Kommode' },
    { id: 'reloj', es: 'el reloj', de: 'die Uhr' },
    { id: 'escalera', es: 'la escalera', de: 'die Treppe' }
  ],
  svg:
  '<svg viewBox="0 0 800 520" font-family="system-ui, sans-serif" stroke="#4a4038" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">' +
    '<rect width="800" height="520" fill="#dcd3c4" stroke="none"/>' +
    '<rect y="380" width="800" height="140" fill="#b9a58c" stroke="none"/>' +
    '<rect y="374" width="800" height="8" fill="#8a7660" stroke="none"/>' +
    '<g data-item="puerta">' +
      '<rect x="55" y="88" width="170" height="288" rx="6" fill="#a9764a"/>' +
      '<rect x="70" y="106" width="60" height="106" rx="4" fill="#b98a58" stroke="none"/>' +
      '<rect x="148" y="106" width="60" height="106" rx="4" fill="#b98a58" stroke="none"/>' +
      '<rect x="70" y="232" width="60" height="128" rx="4" fill="#b98a58" stroke="none"/>' +
      '<rect x="148" y="232" width="60" height="128" rx="4" fill="#b98a58" stroke="none"/>' +
      '<circle cx="216" cy="238" r="7" fill="#e0c46a"/>' +
    '</g>' +
    '<g data-item="felpudo">' +
      '<rect x="62" y="386" width="162" height="32" rx="5" fill="#8a6f4e"/>' +
      '<path d="M84 386v32M106 386v32M128 386v32M150 386v32M172 386v32M194 386v32" stroke="#6f5940" stroke-width="2"/>' +
    '</g>' +
    '<g data-item="timbre">' +
      '<rect x="246" y="126" width="32" height="36" rx="6" fill="#e0ddd6"/>' +
      '<circle cx="262" cy="144" r="8" fill="#c4795e"/>' +
    '</g>' +
    '<g data-item="interruptor">' +
      '<rect x="246" y="196" width="32" height="38" rx="6" fill="#f0eeea"/>' +
      '<rect x="256" y="206" width="13" height="18" rx="3" fill="#c9c4ba"/>' +
    '</g>' +
    '<g data-item="botas">' +
      '<path d="M250 450v-56q0-10 11-10h12q11 0 11 10v36h18q10 0 10 10v10z" fill="#5b4636"/>' +
      '<path d="M250 440h62" stroke-width="2" stroke="#3d2e23"/>' +
      '<path d="M332 450v-56q0-10 11-10h12q11 0 11 10v36h18q10 0 10 10v10z" fill="#6b543f"/>' +
      '<path d="M332 440h62" stroke-width="2" stroke="#3d2e23"/>' +
    '</g>' +
    '<g data-item="perchero">' +
      '<rect x="336" y="148" width="222" height="22" rx="5" fill="#8a5d38"/>' +
      '<path d="M372 170v14q0 8 8 8M470 170v14q0 8 8 8M526 170v14q0 8 8 8" fill="none" stroke-width="4"/>' +
    '</g>' +
    '<g data-item="abrigo">' +
      '<path d="M366 178l-26 16 12 26 16-12v136h56V208l16 12 12-26-26-16-30 18z" fill="#4f6b7a"/>' +
      '<path d="M396 196v148" stroke-width="2"/>' +
      '<g fill="#d8cfc2"><circle cx="396" cy="234" r="4"/><circle cx="396" cy="266" r="4"/><circle cx="396" cy="298" r="4"/></g>' +
    '</g>' +
    '<g data-item="bufanda">' +
      '<path d="M458 176h38v22q0 8-8 8h-22q-8 0-8-8z" fill="#b2493a"/>' +
      '<rect x="458" y="204" width="18" height="104" rx="5" fill="#b2493a"/>' +
      '<rect x="478" y="204" width="18" height="86" rx="5" fill="#c96a53"/>' +
      '<path d="M458 232h38M458 274h38" stroke-width="2" stroke="#8f3b2f"/>' +
    '</g>' +
    '<g data-item="paraguas">' +
      '<path d="M542 204v-12a11 11 0 0 1 22 0" fill="none" stroke-width="4"/>' +
      '<path d="M522 204a10 10 0 0 1 20 0v62l-10 28-10-28z" fill="#3f6f93"/>' +
    '</g>' +
    '<g data-item="reloj">' +
      '<circle cx="640" cy="140" r="42" fill="#f0eeea"/>' +
      '<circle cx="640" cy="140" r="32" fill="#fbf9f6" stroke="none"/>' +
      '<path d="M640 118v22l16 10" fill="none" stroke-width="4"/>' +
      '<path d="M640 106v8M674 140h-8M640 174v-8M606 140h8" stroke-width="3"/>' +
    '</g>' +
    '<g data-item="llave">' +
      '<circle cx="614" cy="258" r="11" fill="#e0c46a"/>' +
      '<circle cx="614" cy="258" r="4" fill="#dcd3c4" stroke="none"/>' +
      '<path d="M625 253h34v10h-34z" fill="#e0c46a"/>' +
      '<path d="M648 263v9M638 263v9" stroke-width="3"/>' +
    '</g>' +
    '<g data-item="comoda">' +
      '<rect x="566" y="272" width="124" height="104" rx="5" fill="#a9764a"/>' +
      '<rect x="576" y="282" width="104" height="26" rx="3" fill="#c08d5c"/>' +
      '<rect x="576" y="314" width="104" height="26" rx="3" fill="#c08d5c"/>' +
      '<rect x="576" y="346" width="104" height="24" rx="3" fill="#c08d5c"/>' +
      '<path d="M616 295h24M616 327h24M616 358h24" stroke-width="3"/>' +
    '</g>' +
    '<g data-item="escalera">' +
      '<path d="M700 376v-34h23v-34h23v-34h23v-34h26v136z" fill="#c9b18d"/>' +
      '<path d="M723 342v34M746 308v34M769 274v34" stroke-width="2"/>' +
      '<path d="M700 306l96-96" stroke-width="4" fill="none"/>' +
      '<path d="M723 318v-24M769 250v-24" stroke-width="3"/>' +
    '</g>' +
  '</svg>'
}
];
