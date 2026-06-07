import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Star, MapPin, Landmark } from "lucide-react";
import type { Resort } from "../../types/resort";
import { Link } from "react-router-dom";
import { useCurrency } from "../../context/CurrencyContext";

// Fix for default marker icons in Leaflet + React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ResortMapProps {
  resorts: Resort[];
  className?: string;
}

const MONUMENTS = [
  { name: "Virupaksha Temple", lat: 15.3350, lng: 76.4600 },
  { name: "Stone Chariot (Vijaya Vittala)", lat: 15.3387, lng: 76.4735 },
  { name: "Lotus Mahal", lat: 15.3204, lng: 76.4633 },
  { name: "Elephant Stables", lat: 15.3216, lng: 76.4646 },
];

export function ResortMap({ resorts, className }: ResortMapProps) {
  const center: [number, number] = [15.335, 76.46]; // Approximate center of Hampi
  const { formatPrice } = useCurrency();

  return (
    <div className={className}>
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {/* Heritage Monuments Layer */}
        {MONUMENTS.map((monument) => (
          <Marker 
            key={monument.name} 
            position={[monument.lat, monument.lng]}
            icon={L.divIcon({
              html: `<div style="background-color: #C5A059; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 2px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22v-1"/><path d="M21 22v-1"/><path d="M12 22v-1"/><path d="M3 18h18"/><path d="M5 18V9"/><path d="M19 18V9"/><path d="M12 18V9"/><path d="M3 9l9-5 9 5"/><path d="M8 18V9"/><path d="M16 18V9"/></svg></div>`,
              className: 'monument-marker',
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
          >
            <Popup className="resort-popup">
              <div className="p-2 text-center">
                <Landmark className="w-6 h-6 text-gold-600 mx-auto mb-2" />
                <h4 className="font-bold text-navy-950 font-serif">{monument.name}</h4>
                <p className="text-[10px] text-navy-950/60 uppercase tracking-widest mt-1">UNESCO World Heritage</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Resort Markers */}
        {resorts.map((resort) => (
          <Marker 
            key={resort.id} 
            position={[resort.location.lat, resort.location.lng]}
          >
            <Popup className="resort-popup">
              <div className="w-48 p-1">
                <img 
                  src={resort.images[0]} 
                  alt={resort.name} 
                  className="w-full h-24 object-cover rounded-xl mb-3"
                />
                <h4 className="font-bold text-navy-950  leading-tight mb-1">{resort.name}</h4>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-3 h-3 text-gold-500 fill-current" />
                  <span className="text-[10px] font-bold">{resort.rating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gold-600">{formatPrice(resort.pricePerNight)}</p>
                  <Link 
                    to={`/resorts/${resort.slug}`}
                    className="text-[10px] font-bold text-navy-950  hover:underline flex items-center gap-0.5"
                  >
                    Details <MapPin className="w-2 h-2" />
                  </Link>
                </div>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${resort.location.lat},${resort.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block w-full py-2 bg-navy-950 text-white text-center text-[10px] font-bold rounded-lg hover:bg-gold-600 transition-colors"
                >
                  Get Directions
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
