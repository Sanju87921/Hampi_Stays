import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Star, MapPin } from "lucide-react";
import type { Resort } from "../../types/resort";
import { Link } from "react-router-dom";

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

export function ResortMap({ resorts, className }: ResortMapProps) {
  const center: [number, number] = [15.335, 76.46]; // Approximate center of Hampi

  return (
    <div className={className}>
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
                <h4 className="font-bold text-navy-950 dark:text-white leading-tight mb-1">{resort.name}</h4>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-3 h-3 text-gold-500 fill-current" />
                  <span className="text-[10px] font-bold">{resort.rating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gold-600">₹{resort.pricePerNight.toLocaleString()}</p>
                  <Link 
                    to={`/resorts/${resort.slug}`}
                    className="text-[10px] font-bold text-navy-950 dark:text-white hover:underline flex items-center gap-0.5"
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
