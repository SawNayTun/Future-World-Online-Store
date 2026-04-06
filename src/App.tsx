import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Heart, Home, User, Search, 
  ChevronLeft, Star, Plus, Minus, Trash2, CheckCircle, X,
  ArrowRight, ArrowLeft, CreditCard, Menu, MessageCircle, Globe, LogOut,
  Play, Crown, Settings, HelpCircle, MapPin, Navigation, Map as MapIcon,
  Moon, Sun, Shield, UserCircle, Store, Package,
  Shirt, Footprints, Smartphone, Watch, Grid, MessageSquare,
  Video, Flame, Zap, TrendingUp, BarChart2, PlayCircle, Share2, Edit2,
  Utensils, Sparkles, Activity
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const AdSenseUnit = ({ slot }: { slot?: string }) => {
  const adRef = useRef<HTMLModElement>(null);
  const hasPushed = useRef(false);

  useEffect(() => {
    // Small delay to ensure the container has a width and is visible
    const timer = setTimeout(() => {
      try {
        if (adRef.current && !hasPushed.current) {
          // Check if the element has width and is not already processed
          const width = adRef.current.offsetWidth;
          if (width > 0 && !adRef.current.getAttribute('data-adsbygoogle-status')) {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            hasPushed.current = true;
          }
        }
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }, 1000); // 1 second delay to be safe with animations

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full overflow-hidden flex justify-center bg-slate-50 rounded-2xl p-2 border border-slate-100 min-h-[100px] min-w-[250px]">
      <ins 
           ref={adRef}
           className="adsbygoogle"
           style={{ display: 'block', minWidth: '250px', minHeight: '100px' }}
           data-ad-client="ca-pub-7099648300221158"
           data-ad-slot={slot || "7099648300"} // Numeric placeholder slot
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};

const RecenterMap = ({ pos }: { pos: [number, number] | null }) => {
  const map = useMap();

  useEffect(() => {
    if (pos) {
      map.setView(pos, 13);
    }
  }, [pos, map]);
  return null;
};

const MapEvents = ({ onLocationSelect, setPosition }: { onLocationSelect: (lat: number, lng: number) => void, setPosition: (pos: [number, number]) => void }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const LocationPicker = ({ initialPosition, onLocationSelect, appLang, showToast, showSaveOptions = false, onSaveOption }: { initialPosition?: [number, number] | null, onLocationSelect: (lat: number, lng: number) => void, appLang: LanguageCode, showToast: (msg: string) => void, showSaveOptions?: boolean, onSaveOption?: (type: 'shop' | 'home', lat: number, lng: number) => void }) => {
  const [position, setPosition] = useState<[number, number] | null>(initialPosition || null);
  const [showOptions, setShowOptions] = useState(false);
  const [tempLocation, setTempLocation] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    } else {
      // Try to get current location on mount
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        onLocationSelect(latitude, longitude);
      }, null, { enableHighAccuracy: true });
    }
  }, [initialPosition]);
  
  const handleUseCurrent = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setPosition([latitude, longitude]);
      onLocationSelect(latitude, longitude);
      if (showSaveOptions) {
        setTempLocation([latitude, longitude]);
        setShowOptions(true);
      }
    }, (err) => {
      console.error('Location error:', err);
      showToast('Could not get current location');
    }, { enableHighAccuracy: true });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPos: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setPosition(newPos);
        onLocationSelect(newPos[0], newPos[1]);
        if (showSaveOptions) {
          setTempLocation(newPos);
          setShowOptions(true);
        }
      } else {
        showToast('Location not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      showToast('Error searching for location');
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
    if (showSaveOptions) {
      setTempLocation([lat, lng]);
      setShowOptions(true);
    }
  };

  const [mapType, setMapType] = useState<'osm' | 'satellite'>('osm');

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="relative">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t(appLang, 'locationSearchPlaceholder')}
          className="w-full pl-10 pr-24 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <button 
          type="submit"
          disabled={isSearching}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 relative">
        <MapContainer center={[17.9757, 102.6331] as any} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer 
            url={mapType === 'osm' 
              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            } 
          />
          <MapEvents onLocationSelect={handleMapClick} setPosition={setPosition} />
          <RecenterMap pos={position} />
          {position && <Marker position={position} />}
        </MapContainer>
        <div className="absolute top-2 right-2 z-[1000]">
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setMapType(prev => prev === 'osm' ? 'satellite' : 'osm');
            }}
            className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-white transition-colors"
          >
            {mapType === 'osm' ? 'Satellite' : 'Map'}
          </button>
        </div>
      </div>
      
      {showOptions && tempLocation && (
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
          <p className="text-sm font-bold text-indigo-900 mb-3 text-center">Save this location as:</p>
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => {
                if (onSaveOption) onSaveOption('shop', tempLocation[0], tempLocation[1]);
                setShowOptions(false);
              }}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
            >
              <Store className="w-4 h-4 inline mr-1" /> {t(appLang, 'shop')}
            </button>
            <button 
              type="button"
              onClick={() => {
                if (onSaveOption) onSaveOption('home', tempLocation[0], tempLocation[1]);
                setShowOptions(false);
              }}
              className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
            >
              <Home className="w-4 h-4 inline mr-1" /> {t(appLang, 'home')}
            </button>
          </div>
        </div>
      )}

      <button 
        type="button"
        onClick={handleUseCurrent}
        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
      >
        <Navigation className="w-5 h-5" /> {t(appLang, 'currentLocation')}
      </button>
    </div>
  );
};

const FitBounds = ({ buyer, seller }: { buyer: [number, number], seller: [number, number] | null }) => {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (seller && !hasFitted.current) {
      const bounds = L.latLngBounds([buyer, seller]);
      map.fitBounds(bounds, { padding: [50, 50] });
      hasFitted.current = true;
    }
  }, [buyer, seller, map]);
  return null;
};

const AccountScreen = ({ user, setUser, setProfileView, appLang, showToast, userRole }: any) => {
  const [name, setName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [shopLocation, setShopLocation] = useState<[number, number] | null>(
    user?.shopLocation ? [user.shopLocation.latitude, user.shopLocation.longitude] : null
  );
  const [homeLocation, setHomeLocation] = useState<[number, number] | null>(
    user?.homeLocation ? [user.homeLocation.latitude, user.homeLocation.longitude] : null
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updateData: any = { displayName: name, bio };
      if (shopLocation) {
        updateData.shopLocation = {
          latitude: shopLocation[0],
          longitude: shopLocation[1]
        };
      }
      if (homeLocation) {
        updateData.homeLocation = {
          latitude: homeLocation[0],
          longitude: homeLocation[1]
        };
      }
      await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
      
      if (updateData.shopLocation || updateData.displayName) {
        const productsQuery = query(collection(db, 'products'), where('sellerId', '==', user.uid));
        const querySnapshot = await getDocs(productsQuery);
        querySnapshot.forEach(async (productDoc) => {
          const updateObj: any = {};
          if (updateData.shopLocation) updateObj.sellerLocation = updateData.shopLocation;
          if (updateData.displayName) updateObj.sellerName = updateData.displayName;
          await updateDoc(productDoc.ref, updateObj);
        });
      }

      setUser({ ...user, ...updateData });
      showToast(t(appLang, 'profileUpdated'));
      setProfileView('main');
    } catch (error) {
      showToast(t(appLang, 'profileUpdateFail'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLocationOption = (type: 'shop' | 'home', lat: number, lng: number) => {
    if (type === 'shop') {
      setShopLocation([lat, lng]);
      showToast(t(appLang, 'shopLocationSelected'));
    } else {
      setHomeLocation([lat, lng]);
      showToast(t(appLang, 'homeLocationSelected'));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto w-full pb-20"
    >
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setProfileView('main')} 
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
          <span className="font-bold text-slate-600 text-sm">{t(appLang, 'back')}</span>
        </button>
        <h2 className="text-2xl font-bold text-slate-900">{t(appLang, 'accountManagement')}</h2>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">{t(appLang, 'fullName')}</label>
          <input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-indigo-600"
            placeholder={t(appLang, 'namePlaceholder')}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">{t(appLang, 'bio')}</label>
          <textarea 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-indigo-600"
            placeholder={t(appLang, 'bioPlaceholder')}
            rows={3}
          />
        </div>

        <div className="pt-4 border-t border-slate-100">
          <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" /> {t(appLang, 'locationSettings')}
          </label>
          <div className="space-y-4">
            <LocationPicker 
              initialPosition={shopLocation || homeLocation}
              onLocationSelect={() => {}} 
              appLang={appLang} 
              showToast={showToast} 
              showSaveOptions={true}
              onSaveOption={handleSaveLocationOption}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {shopLocation && (
                <div className="p-4 bg-indigo-50 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold">
                    <Store className="w-4 h-4" /> {t(appLang, 'shopLocation')}
                  </div>
                  <p className="text-xs text-indigo-700 font-medium">
                    {shopLocation[0].toFixed(4)}, {shopLocation[1].toFixed(4)}
                  </p>
                </div>
              )}
              {homeLocation && (
                <div className="p-4 bg-emerald-50 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <Home className="w-4 h-4" /> {t(appLang, 'homeLocation')}
                  </div>
                  <p className="text-xs text-emerald-700 font-medium">
                    {homeLocation[0].toFixed(4)}, {homeLocation[1].toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
        >
          {isSaving ? t(appLang, 'saving') : t(appLang, 'saveChanges')}
        </button>
      </div>
    </motion.div>
  );
};

const LiveTrackingMap = ({ order, appLang }: { order: any, appLang: LanguageCode }) => {
  const buyerPos: [number, number] = [order.address.latitude || 17.9757, order.address.longitude || 102.6331];
  const sellerPos: [number, number] | null = order.sellerLocation ? [order.sellerLocation.latitude, order.sellerLocation.longitude] : null;

  return (
    <div className="h-96 rounded-3xl overflow-hidden border border-slate-100 shadow-inner relative mt-4">
      <MapContainer center={buyerPos} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds buyer={buyerPos} seller={sellerPos} />
        <Marker position={buyerPos}>
          <Popup>{t(appLang, 'buyerLocation')}</Popup>
        </Marker>
        {sellerPos && (
          <>
            <Marker position={sellerPos} icon={L.icon({
              iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
              iconSize: [40, 40],
              iconAnchor: [20, 40]
            })}>
              <Popup>{t(appLang, 'sellerLocation')}</Popup>
            </Marker>
            <Polyline positions={[buyerPos, sellerPos]} color="#4f46e5" weight={4} dashArray="10, 10" />
          </>
        )}
      </MapContainer>
      
      {/* Uber-style Floating Info Card */}
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t(appLang, 'estimatedArrival')}</p>
              <p className="text-lg font-bold text-slate-900">12 - 15 mins</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t(appLang, 'status')}</p>
            <p className="text-sm font-bold text-emerald-600 flex items-center gap-1 justify-end">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              {t(appLang, 'delivering')}
            </p>
          </div>
        </div>
      </div>

      {/* Seller Profile Card at bottom */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000]">
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4">
          <img src={order.items[0]?.image} className="w-14 h-14 rounded-xl object-cover border border-white/20" />
          <div className="flex-1">
            <h4 className="font-bold text-sm line-clamp-1">{order.items.map((i: any) => i.title).join(', ')}</h4>
            <p className="text-xs text-slate-400">{t(appLang, 'orderNumber')}{order.id.slice(-6)}</p>
          </div>
          <button className="bg-white text-slate-900 p-3 rounded-xl hover:bg-slate-100 transition-colors">
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

import { categories } from './data';
import { Product, CartItem, Seller } from './types';
import { languages, LanguageCode, t } from './i18n';
import ChatSystem from './components/ChatSystem';
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, getDoc, where, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const LiveScreen = ({ setActiveTab, appLang, products, setSelectedProduct }: { setActiveTab: (tab: string) => void, appLang: LanguageCode, products: Product[], setSelectedProduct: (product: Product | null) => void }) => {
  const [activeVideo, setActiveVideo] = useState(0);
  
  const liveProducts = products.filter(p => p.video);

  if (liveProducts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 lg:relative lg:inset-auto lg:h-[calc(100vh-12rem)] lg:rounded-3xl lg:overflow-hidden flex flex-col items-center justify-center text-white">
        <Video className="w-16 h-16 text-slate-600 mb-4" />
        <h2 className="text-xl font-bold mb-2">{t(appLang, 'noLiveStreams')}</h2>
        <p className="text-slate-400 text-center max-w-sm mb-6">{t(appLang, 'noLiveStreamsText')}</p>
        <button 
          onClick={() => setActiveTab('Home')}
          className="px-6 py-3 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
        >
          {t(appLang, 'backToHome')}
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      key="live"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 lg:relative lg:inset-auto lg:h-[calc(100vh-12rem)] lg:rounded-3xl lg:overflow-hidden"
    >
      <div className="h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
        {liveProducts.map((product, index) => {
          return (
            <div key={product.id} className="h-full w-full snap-start relative flex items-center justify-center bg-slate-900">
              <video 
                src={product.video} 
                autoPlay={index === activeVideo}
                loop 
                muted 
                playsInline
                className="h-full w-full object-cover"
                onPlay={() => setActiveVideo(index)}
              />
              
              {/* Overlay Content */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 p-6 flex flex-col justify-end">
                <div className="flex items-end justify-between gap-4">
                  <div className="flex-1 mb-20 lg:mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden">
                        <img src={product.seller.avatar} alt={product.seller.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{product.seller.name}</h3>
                        <p className="text-white/80 text-sm">{product.name}</p>
                      </div>
                      <button className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold ml-2">{t(appLang, 'follow')}</button>
                    </div>
                    <p className="text-white/90 text-sm line-clamp-2 max-w-md mb-4">
                      {product.description}
                    </p>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 border border-white/20 max-w-sm cursor-pointer hover:bg-white/20 transition-colors" onClick={() => setSelectedProduct(product)}>
                      <img src={product.image} alt={product.name} className="w-12 h-12 rounded-xl object-cover" />
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm line-clamp-1">{product.name}</p>
                        <p className="text-indigo-300 font-bold text-sm">{product.currency || 'MMK'} {product.price}</p>
                      </div>
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-1">
                        {t(appLang, 'buy')}
                      </button>
                    </div>
                  </div>

                  {/* Sidebar Actions */}
                  <div className="flex flex-col gap-6 mb-24 lg:mb-10">
                    <div className="flex flex-col items-center gap-1">
                      <button className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all">
                        <Heart className="w-6 h-6" />
                      </button>
                      <span className="text-white text-xs font-bold">{Math.floor(Math.random() * 1000)}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <button className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all">
                        <MessageCircle className="w-6 h-6" />
                      </button>
                      <span className="text-white text-xs font-bold">{Math.floor(Math.random() * 100)}</span>
                    </div>
                    <button className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all">
                      <Share2 className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setSelectedProduct(product)}
                      className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-600/40 animate-bounce"
                    >
                      <ShoppingBag className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Back Button */}
              <button 
                onClick={() => setActiveTab('Home')}
                className="absolute top-6 left-6 lg:hidden w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const ExploreScreen = ({ products, appLang, setActiveSeller, setActiveTab }: { products: Product[], appLang: LanguageCode, setActiveSeller: (seller: Seller) => void, setActiveTab: (tab: string) => void }) => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLocation([pos.coords.latitude, pos.coords.longitude]);
    }, null, { enableHighAccuracy: true });
  }, []);
  
  // Get unique sellers from products and calculate distance
  const sellers = useMemo(() => {
    const sellerMap = new Map<string, any>();
    products.forEach(p => {
      if (!sellerMap.has(p.seller.id)) {
        let distance = null;
        if (userLocation && p.seller.shopLocation) {
          distance = calculateDistance(
            userLocation[0], userLocation[1],
            p.seller.shopLocation.latitude, p.seller.shopLocation.longitude
          );
        }
        sellerMap.set(p.seller.id, {
          ...p.seller,
          products: [p],
          distance
        });
      } else {
        sellerMap.get(p.seller.id).products.push(p);
      }
    });
    
    const sellerList = Array.from(sellerMap.values());
    // Sort by distance if available
    if (userLocation) {
      sellerList.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }
    return sellerList;
  }, [products, userLocation]);

  return (
    <motion.div 
      key="explore"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-[calc(100vh-16rem)] lg:h-[calc(100vh-12rem)] flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">{t(appLang, 'explore')}</h1>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            {t(appLang, 'mapView')}
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            {t(appLang, 'listView')}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col lg:flex-row">
        {(viewMode === 'list') && (
          <div className="w-full h-full overflow-y-auto border-r border-slate-100 p-4 flex flex-col gap-4 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 px-2">{t(appLang, 'nearbySellers')}</h3>
            {sellers.map(seller => (
              <div 
                key={seller.id}
                onClick={() => {
                  setActiveSeller(seller);
                  setActiveTab('Chat');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img src={seller.avatar} alt={seller.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{seller.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      4.9 • {seller.distance ? `${seller.distance.toFixed(1)}km` : t(appLang, 'notAvailable')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                  {seller.products.slice(0, 3).map((p: any) => (
                    <img key={p.id} src={p.image} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'map' && (
          <div className="flex-1 relative min-h-[400px]">
            <MapContainer 
              center={userLocation || [17.9757, 102.6331]} 
              zoom={13} 
              className="h-full w-full z-0"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <RecenterMap pos={userLocation} />
              {sellers.map(seller => (
                <Marker 
                  key={seller.id} 
                  position={seller.shopLocation ? [seller.shopLocation.latitude, seller.shopLocation.longitude] : [17.9757 + (Math.random() - 0.5) * 0.05, 102.6331 + (Math.random() - 0.5) * 0.05]}
                  icon={L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div class="w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white"><img src="${seller.avatar}" class="w-full h-full object-cover" /></div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 40]
                  })}
                >
                  <Popup className="rounded-2xl overflow-hidden">
                    <div className="p-2 min-w-[200px]">
                      <div className="flex items-center gap-3 mb-3">
                        <img src={seller.avatar} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <h4 className="font-bold text-slate-900 m-0">{seller.name}</h4>
                          <p className="text-xs text-slate-500 m-0">{t(appLang, 'verifiedSeller')}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setActiveSeller(seller);
                          setActiveTab('Chat');
                        }}
                        className="w-full bg-slate-900 text-white py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                      >
                        {t(appLang, 'chatWithSeller')}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const AdBanner = ({ isPremium, appLang, watchAd }: { isPremium: boolean, appLang: LanguageCode, watchAd: () => void }) => {
  if (isPremium) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2 px-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t(appLang, 'advertisement')}</p>
        <button onClick={watchAd} className="text-xs text-indigo-600 font-bold hover:underline">{t(appLang, 'watchAd')}</button>
      </div>
      <AdSenseUnit />
    </div>
  );
};

const HomeScreen = ({ 
  products, 
  filteredProducts, 
  selectedCategory, 
  setSelectedCategory, 
  searchQuery, 
  setSearchQuery,
  appLang, 
  handleProductSelect, 
  toggleFavorite, 
  favorites, 
  formatPrice, 
  isPremium, 
  watchAd, 
  setActiveSeller, 
  setActiveTab 
}: any) => {
  return (
    <motion.div 
      key="home"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-12"
    >
      {/* Hero Section (Compact & Conditional) */}
      {products.length > 0 && (
        <section className="relative py-8 lg:py-10 overflow-hidden rounded-[2rem] bg-slate-900 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/20 blur-[80px] rounded-full"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/20 blur-[80px] rounded-full"></div>
          </div>
          
          <div className="relative z-10 px-6 lg:px-10 flex flex-col items-center text-center gap-6">
            {/* Popular Products */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Popular Searches</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                {[...products].sort((a, b) => b.reviews - a.reviews).slice(0, 5).map(p => (
                  <button 
                    key={p.id}
                    onClick={() => {
                      setSearchQuery(p.name);
                      setActiveTab('Explore');
                    }}
                    className="flex flex-col items-center gap-2 min-w-[100px] group"
                  >
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-700 shadow-sm group-hover:scale-105 transition-transform">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-bold text-slate-300 text-center line-clamp-1">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Flash Sale Section (E-commerce Style) */}
      {products.filter((p: any) => p.discountPrice != null).length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                <Zap className="w-6 h-6 fill-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">{t(appLang, 'flashSale')}</h2>
                <p className="text-slate-500 text-sm font-medium">Ending in 04:23:12</p>
              </div>
            </div>
            <button className="text-sm font-bold text-indigo-600 hover:underline">{t(appLang, 'viewAll')}</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {products.filter((p: any) => p.discountPrice != null).slice(0, 3).map((p: any, i: number) => (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleProductSelect(p)}
                className="group bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-6 left-6 z-10 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  -{Math.round(((p.price - p.discountPrice) / p.price) * 100)}% OFF
                </div>
                <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-slate-50">
                  <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1 line-clamp-1">{p.name}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black text-indigo-600">{formatPrice(p.discountPrice, p.currency)}</span>
                  <span className="text-sm text-slate-400 line-through">{formatPrice(p.price, p.currency)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <AdBanner isPremium={isPremium} appLang={appLang} watchAd={watchAd} />

      {/* Popular Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">{t(appLang, 'popularCategories')}</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-4">
          {[
            { id: 'All', icon: Grid, color: 'bg-indigo-50 text-indigo-600' },
            { id: 'Clothing', icon: Shirt, color: 'bg-orange-50 text-orange-600' },
            { id: 'Shoes', icon: Footprints, color: 'bg-blue-50 text-blue-600' },
            { id: 'Electronics', icon: Smartphone, color: 'bg-purple-50 text-purple-600' },
            { id: 'Accessories', icon: Watch, color: 'bg-pink-50 text-pink-600' },
            { id: 'Home', icon: Home, color: 'bg-emerald-50 text-emerald-600' },
            { id: 'Food', icon: Utensils, color: 'bg-red-50 text-red-600' },
            { id: 'Beauty', icon: Sparkles, color: 'bg-yellow-50 text-yellow-600' },
            { id: 'Health', icon: Activity, color: 'bg-cyan-50 text-cyan-600' },
            { id: 'Other', icon: Package, color: 'bg-slate-50 text-slate-600' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border ${
                selectedCategory === cat.id ? 'border-indigo-600 bg-indigo-50/50 shadow-inner' : 'border-transparent bg-white shadow-sm hover:shadow-md'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.color}`}>
                <cat.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-700">{t(appLang, `cat${cat.id}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nearby Sellers (Store Locator style) */}
      {/* 
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">{t(appLang, 'nearbySellers')}</h2>
          <button onClick={() => setActiveTab('Explore')} className="text-sm font-bold text-indigo-600 hover:underline">{t(appLang, 'catAll')}</button>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {Array.from(new Set(products.map((p: any) => p.seller.id))).slice(0, 5).map(sellerId => {
            const seller = products.find((p: any) => p.seller.id === sellerId)?.seller;
            if (!seller) return null;
            return (
              <div 
                key={seller.id}
                onClick={() => {
                  setActiveSeller(seller);
                  setActiveTab('Chat');
                }}
                className="flex flex-col items-center gap-2 min-w-[100px] cursor-pointer group"
              >
                <div className="relative">
                  <img src={seller.avatar} alt={seller.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md group-hover:border-indigo-500 transition-all" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <span className="text-xs font-bold text-slate-900 text-center line-clamp-1">{seller.name}</span>
                <span className="text-[10px] text-slate-500">1.2km</span>
              </div>
            );
          })}
        </div>
      </div>
      */}

      {/* Product Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              {searchQuery ? t(appLang, 'searchResults') : (selectedCategory === 'All' ? t(appLang, 'trendingNow') : t(appLang, `cat${selectedCategory}`))}
            </h2>
            {(selectedCategory !== 'All' || searchQuery) && (
              <button 
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                {t(appLang, 'catAll')} ✕
              </button>
            )}
          </div>
          <span className="text-slate-500 text-sm">{filteredProducts.length} {t(appLang, 'items')}</span>
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-slate-500 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-xl font-bold text-slate-900 mb-2">{t(appLang, 'noProductsFound')}</p>
            <p className="mb-8 text-slate-500 max-w-xs mx-auto">{t(appLang, 'tryAdjusting')}</p>
            <button 
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              {t(appLang, 'viewAll')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product: any, index: number) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleProductSelect(product)}
                className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-sm border border-slate-100 cursor-pointer group flex flex-col"
              >
                <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden mb-4 bg-slate-100">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={(e) => toggleFavorite(product.id, e)}
                    className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full text-slate-900 hover:bg-white transition-colors z-10 shadow-sm"
                  >
                    <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${favorites.has(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-slate-900 flex items-center shadow-sm">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400 mr-1" />
                    {product.rating}
                  </div>
                </div>
                <div className="flex flex-col flex-1">
                  <p className="text-slate-500 text-xs font-medium mb-1 uppercase tracking-wider">{t(appLang, `cat${product.category}`)}</p>
                  <h3 className="text-slate-900 font-bold text-sm sm:text-base line-clamp-2 mb-2 flex-1">{product.name}</h3>
                  <div className="flex justify-between items-center mt-auto">
                    <div>
                      {product.discountPrice != null ? (
                        <>
                          <p className="text-indigo-600 font-bold text-lg">{formatPrice(product.discountPrice, product.currency)}</p>
                          <p className="text-slate-400 text-xs line-through">{formatPrice(product.price, product.currency)}</p>
                        </>
                      ) : (
                        <p className="text-indigo-600 font-bold text-lg">{formatPrice(product.price, product.currency)}</p>
                      )}
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const CartScreen = ({ 
  cart, 
  appLang, 
  formatPrice, 
  updateCartQuantity, 
  removeFromCart, 
  setActiveTab, 
  cartTotal, 
  onCheckout 
}: any) => {
  return (
    <motion.div 
      key="cart"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto w-full"
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{t(appLang, 'shoppingCart')}</h1>
        <span className="bg-indigo-100 text-indigo-600 px-4 py-1 rounded-full text-sm font-bold">
          {cart.length} {t(appLang, 'items')}
        </span>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t(appLang, 'cartEmpty')}</h2>
          <p className="text-slate-500 mb-8">{t(appLang, 'cartEmptyText')}</p>
          <button 
            onClick={() => setActiveTab('Home')}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors"
          >
            {t(appLang, 'startShopping')}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            {cart.map((item: any, i: number) => (
              <div key={item.id} className={`p-6 flex gap-4 ${i !== 0 ? 'border-t border-slate-100' : ''}`}>
                <img src={item.image} alt={item.name} className="w-24 h-24 rounded-2xl object-cover bg-slate-50" />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-900">{item.name}</h3>
                    <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-indigo-600 font-bold mb-4">{formatPrice(item.price, item.currency)}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-100 rounded-xl p-1">
                      <button 
                        onClick={() => updateCartQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-slate-900">{item.quantity}</span>
                      <button 
                        onClick={() => updateCartQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 text-lg">{t(appLang, 'orderSummary')}</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-slate-500">
                <span>{t(appLang, 'subtotal')}</span>
                <span>{formatPrice(cartTotal, 'MMK')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{t(appLang, 'shipping')}</span>
                <span className="text-emerald-600 font-bold">{t(appLang, 'free')}</span>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900">{t(appLang, 'total')}</span>
                <span className="text-2xl font-black text-indigo-600">{formatPrice(cartTotal, 'MMK')}</span>
              </div>
            </div>
            <button 
              onClick={onCheckout}
              className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3"
            >
              <CreditCard className="w-6 h-6" /> {t(appLang, 'checkout')}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const SettingsScreen = ({ 
  appLang, 
  setProfileView, 
  languages, 
  handleLanguageChange, 
  theme, 
  toggleTheme 
}: any) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="max-w-2xl mx-auto w-full"
  >
    <div className="flex items-center gap-4 mb-6">
      <button 
        onClick={() => setProfileView('main')} 
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-slate-600" />
        <span className="font-bold text-slate-600 text-sm">{t(appLang, 'back')}</span>
      </button>
      <h2 className="text-2xl font-bold text-slate-900">{t(appLang, 'settings')}</h2>
    </div>

    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 mb-4">{t(appLang, 'language')}</h3>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(languages) as LanguageCode[]).map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`p-4 rounded-2xl border-2 transition-all text-center font-bold ${
                appLang === lang 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                  : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
              }`}
            >
              {languages[lang]}
            </button>
          ))}
        </div>
      </div>
      <div className="p-6">
        <h3 className="font-bold text-slate-900 mb-4">Theme</h3>
        <button
          onClick={toggleTheme}
          className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-white text-slate-600 font-bold hover:border-indigo-200 transition-all"
        >
          {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        </button>
      </div>
      <div className="p-6">
        <h3 className="font-bold text-slate-900 mb-4">{t(appLang, 'notifications')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">{t(appLang, 'orderUpdates')}</span>
            <div className="w-12 h-6 bg-indigo-600 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">{t(appLang, 'promotions')}</span>
            <div className="w-12 h-6 bg-slate-200 rounded-full relative">
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const HelpScreen = ({ appLang, setProfileView }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="max-w-2xl mx-auto w-full"
  >
    <div className="flex items-center gap-4 mb-6">
      <button 
        onClick={() => setProfileView('main')} 
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-slate-600" />
        <span className="font-bold text-slate-600 text-sm">{t(appLang, 'back')}</span>
      </button>
      <h2 className="text-2xl font-bold text-slate-900">{t(appLang, 'helpSupport')}</h2>
    </div>

    <div className="space-y-4">
      {[
        { title: 'FAQ', icon: <HelpCircle className="w-5 h-5" /> },
        { title: 'Contact Us', icon: <MessageCircle className="w-5 h-5" /> },
        { title: 'Privacy Policy', icon: <Globe className="w-5 h-5" /> },
        { title: 'Terms of Service', icon: <CheckCircle className="w-5 h-5" /> }
      ].map(item => (
        <button key={item.title} className="w-full bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
              {item.icon}
            </div>
            <span className="font-bold text-slate-900">{item.title}</span>
          </div>
          <ChevronLeft className="w-5 h-5 text-slate-300 rotate-180" />
        </button>
      ))}
    </div>
  </motion.div>
);

const PaymentsScreen = ({ 
  user, 
  userRole, 
  appLang, 
  paymentDetails, 
  setPaymentDetails, 
  setProfileView, 
  showToast 
}: any) => {
  const handleSavePayment = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { paymentDetails }, { merge: true });
      showToast(t(appLang, 'addressSavedSuccess'));
    } catch (error) {
      showToast(t(appLang, 'addressSavedFail'));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto w-full"
    >
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setProfileView('main')} 
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
          <span className="font-bold text-slate-600 text-sm">{t(appLang, 'back')}</span>
        </button>
        <h2 className="text-2xl font-bold text-slate-900">{t(appLang, 'paymentMethods')}</h2>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100">
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {userRole === 'seller' ? 'Payment Details (Bank Account/Mobile Wallet)' : 'Your Payment Method'}
          </label>
          <textarea
            value={paymentDetails}
            onChange={(e) => setPaymentDetails(e.target.value)}
            className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Enter your payment details here..."
            rows={4}
          />
        </div>
        <button 
          onClick={handleSavePayment}
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          {t(appLang, 'save')}
        </button>
      </div>
    </motion.div>
  );
};

const SecurityScreen = ({ user, appLang, setProfileView }: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto w-full"
    >
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setProfileView('main')} 
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
          <span className="font-bold text-slate-600 text-sm">{t(appLang, 'back')}</span>
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Security & Sessions</h2>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-6">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-2">Authentication Provider</h3>
          <div className="flex items-center gap-2 text-slate-600">
            <Globe className="w-4 h-4" />
            <span>Google Authentication</span>
          </div>
        </div>
        
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-2">Last Login</h3>
          <div className="flex items-center gap-2 text-slate-600">
            <Star className="w-4 h-4" />
            <span>{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-2">Account ID</h3>
          <div className="flex items-center gap-2 text-slate-600 font-mono text-xs">
            <span>{user?.uid}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PrivacyScreen = ({ appLang, setProfileView }: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto w-full"
    >
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setProfileView('main')} 
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
          <span className="font-bold text-slate-600 text-sm">{t(appLang, 'back')}</span>
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Privacy & Data</h2>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-6">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Clear Local Data</h3>
            <p className="text-sm text-slate-500">Remove cached data, search history, and preferences from this device.</p>
          </div>
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to clear local data? You will be logged out.")) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-colors"
          >
            Clear Data
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Ad Personalization</h3>
            <p className="text-sm text-slate-500">Allow us to show ads that are relevant to your interests.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Delete Account</h3>
            <p className="text-sm text-slate-500">Permanently delete your account and all associated data.</p>
          </div>
          <button 
            onClick={() => alert("To delete your account, please contact support.")}
            className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ProfileScreen = ({
  user,
  profileView,
  userRole,
  userOrders,
  sellerOrders,
  appLang,
  formatPrice,
  setProfileView,
  handleStartDelivery,
  stopDelivery,
  userAddresses,
  setShowAddAddress,
  showAddAddress,
  handleDeleteAddress,
  handleSaveAddress,
  setSelectedLocation,
  showToast,
  paymentDetails,
  setPaymentDetails,
  languages,
  handleLanguageChange,
  theme,
  toggleTheme,
  setUser,
  handleLogin,
  handleLogout,
  favorites,
  isAdmin,
  pendingUsers,
  handleApprovePremium,
  handleRejectPremium,
  isPremium,
  premiumStatus,
  handleRequestPremium,
  watchAd,
  isWatchingAd,
  setShowAddProduct,
  toggleRole
}: any) => {
  if (!user) {
    return (
      <motion.div 
        key="profile-login"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="max-w-md mx-auto w-full pt-12"
      >
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center">
          <div className="w-20 h-20 mx-auto bg-indigo-50 rounded-full flex items-center justify-center mb-6">
            <User className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t(appLang, 'welcome')}</h2>
          <p className="text-slate-500 mb-8">{t(appLang, 'signInToManage')}</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Sign in with Google
          </button>
        </div>
      </motion.div>
    );
  }

  if (profileView === 'orders') return <OrdersScreen userRole={userRole} userOrders={userOrders} sellerOrders={sellerOrders} appLang={appLang} formatPrice={formatPrice} setProfileView={setProfileView} handleStartDelivery={handleStartDelivery} stopDelivery={stopDelivery} handleAcceptDelivery={handleAcceptDelivery} />;
  if (profileView === 'addresses') return <AddressesScreen userAddresses={userAddresses} appLang={appLang} setProfileView={setProfileView} setShowAddAddress={setShowAddAddress} showAddAddress={showAddAddress} handleDeleteAddress={handleDeleteAddress} handleSaveAddress={handleSaveAddress} setSelectedLocation={setSelectedLocation} showToast={showToast} />;
  if (profileView === 'payments') return <PaymentsScreen user={user} userRole={userRole} appLang={appLang} paymentDetails={paymentDetails} setPaymentDetails={setPaymentDetails} setProfileView={setProfileView} showToast={showToast} />;
  if (profileView === 'settings') return <SettingsScreen appLang={appLang} setProfileView={setProfileView} languages={languages} handleLanguageChange={handleLanguageChange} theme={theme} toggleTheme={toggleTheme} />;
  if (profileView === 'help') return <HelpScreen appLang={appLang} setProfileView={setProfileView} />;
  if (profileView === 'privacy') return <PrivacyScreen appLang={appLang} setProfileView={setProfileView} />;
  if (profileView === 'account') return <AccountScreen user={user} setUser={setUser} setProfileView={setProfileView} appLang={appLang} showToast={showToast} userRole={userRole} />;
  if (profileView === 'security') return <SecurityScreen user={user} appLang={appLang} setProfileView={setProfileView} />;

  return (
    <motion.div 
      key="profile"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto w-full"
    >
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center mb-6">
        <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full p-1 mb-4 relative flex items-center justify-center">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="w-full h-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <User className="w-12 h-12 text-slate-400" />
          )}
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full"></div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{user.displayName || 'User'}</h2>
        <p className="text-slate-500 mt-1">{user.email}</p>
        {user.bio && <p className="text-slate-600 mt-3 text-sm italic">"{user.bio}"</p>}
        <div className="mt-3 inline-flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-sm font-bold">
          <span className="w-2 h-2 rounded-full bg-green-500"></span> {t(appLang, userRole)} {t(appLang, 'account')}
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100">
          <button onClick={() => setProfileView('orders')} className="hover:bg-slate-50 p-2 rounded-2xl transition-colors">
            <p className="text-2xl font-bold text-slate-900">{userOrders.length}</p>
            <p className="text-slate-500 text-xs uppercase tracking-wider mt-1">{t(appLang, 'orders')}</p>
          </button>
          <div>
            <p className="text-2xl font-bold text-slate-900">{favorites.size}</p>
            <p className="text-slate-500 text-xs uppercase tracking-wider mt-1">{t(appLang, 'saved')}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">0</p>
            <p className="text-slate-500 text-xs uppercase tracking-wider mt-1">{t(appLang, 'reviews')}</p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 text-left">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-600" /> {t(appLang, 'adminControlPanel')}
          </h3>
          
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-700 mb-2">{t(appLang, 'pendingPremium')}</p>
            {pendingUsers.length > 0 ? (
              pendingUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <img src={u.photoURL || 'https://picsum.photos/seed/user/100/100'} alt="" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{u.displayName}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApprovePremium(u.id)}
                      className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                    >
                      {t(appLang, 'approve')}
                    </button>
                    <button 
                      onClick={() => handleRejectPremium(u.id)}
                      className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
                    >
                      {t(appLang, 'reject')}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">{t(appLang, 'noPendingRequests')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPremium ? 'bg-amber-100' : 'bg-slate-100'}`}>
              {isPremium ? <Crown className="w-6 h-6 text-amber-600" /> : <Star className="w-6 h-6 text-slate-400" />}
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900">{isPremium ? t(appLang, 'premiumMember') : t(appLang, 'membership')}</h3>
              <p className="text-sm text-slate-500">
                {isPremium ? t(appLang, 'noAds') : 
                 premiumStatus === 'pending' ? t(appLang, 'requestPending') :
                 premiumStatus === 'rejected' ? t(appLang, 'requestRejected') :
                 t(appLang, 'upgradeToPremium')}
              </p>
            </div>
          </div>
          {!isPremium && premiumStatus !== 'pending' && (
            <button 
              onClick={handleRequestPremium}
              className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200"
            >
              {t(appLang, 'upgradeToPremium')}
            </button>
          )}
          {premiumStatus === 'pending' && (
            <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              {t(appLang, 'pending')}
            </div>
          )}
        </div>
        
        {!isPremium && (
          <div className="pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-600 mb-3 text-left">{t(appLang, 'supportApp')}</p>
            <button 
              onClick={watchAd}
              disabled={isWatchingAd}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all ${
                isWatchingAd 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              {isWatchingAd ? (
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Play className="w-5 h-5" fill="currentColor" />
              )}
              {t(appLang, 'watchAd')}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        {userRole === 'seller' && (
          <button 
            onClick={() => setShowAddProduct(true)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors border-b border-slate-100"
          >
            <span className="font-bold text-emerald-600 flex items-center gap-2">
              <Plus className="w-5 h-5" /> {t(appLang, 'addNewProduct')}
            </span>
            <ChevronLeft className="w-5 h-5 text-emerald-400 rotate-180" />
          </button>
        )}
        {[
          { key: 'Account Management', view: 'account', isCustom: true, icon: UserCircle },
          { key: 'Security & Sessions', view: 'security', isCustom: true, icon: Shield },
          { key: 'myOrders', view: 'orders', icon: ShoppingBag },
          { key: 'shippingAddresses', view: 'addresses', icon: MapPin },
          { key: 'paymentMethods', view: 'payments', icon: CreditCard },
          { key: 'settings', view: 'settings', icon: Settings },
          { key: 'Privacy & Data', view: 'privacy', isCustom: true, icon: Shield },
          { key: 'helpSupport', view: 'help', icon: HelpCircle }
        ].map((item, i) => (
          <button 
            key={item.key} 
            onClick={() => setProfileView(item.view as any)}
            className={`w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors ${i !== 0 ? 'border-t border-slate-100' : ''}`}
          >
            <div className="flex items-center gap-3">
              {item.icon && <item.icon className="w-5 h-5 text-slate-400" />}
              <span className="font-medium text-slate-700">{item.isCustom ? item.key : t(appLang, item.key as any)}</span>
            </div>
            <ChevronLeft className="w-5 h-5 text-slate-400 rotate-180" />
          </button>
        ))}
        <button 
          onClick={toggleRole}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors border-t border-slate-100"
        >
          <span className="font-bold text-indigo-600">{t(appLang, 'switchTo')} {userRole === 'buyer' ? t(appLang, 'seller') : userRole === 'seller' ? t(appLang, 'delivery') : t(appLang, 'buyer')} {t(appLang, 'account')}</span>
          <ChevronLeft className="w-5 h-5 text-indigo-400 rotate-180" />
        </button>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full bg-white rounded-3xl p-5 shadow-sm border border-red-100 text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        {t(appLang, 'logout')}
      </button>
    </motion.div>
  );
};

const OrdersScreen = ({ 
  userRole, 
  userOrders, 
  sellerOrders, 
  appLang, 
  formatPrice, 
  setProfileView, 
  handleStartDelivery, 
  stopDelivery,
  handleAcceptDelivery
}: any) => {
  const ordersToShow = userRole === 'seller' ? sellerOrders : userOrders;
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto w-full"
    >
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setProfileView('main')} 
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
          <span className="font-bold text-slate-600 text-sm">{t(appLang, 'back')}</span>
        </button>
        <h2 className="text-2xl font-bold text-slate-900">{userRole === 'seller' ? t(appLang, 'sellerOrders') : t(appLang, 'myOrders')}</h2>
      </div>

      {ordersToShow.length > 0 ? (
        <div className="space-y-4">
          {ordersToShow.map((order: any) => (
            <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{t(appLang, 'orderId')}: {order.id.slice(-8)}</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{t(appLang, 'orderDate')}: {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 
                  order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 
                  order.status === 'delivering' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {t(appLang, 'status')}: {order.status}
                </div>
              </div>

              {/* Order Items with Images */}
              <div className="flex gap-3 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex-shrink-0 w-20 group">
                    <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-slate-100 shadow-sm mb-1">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" 
                        referrerPolicy="no-referrer"
                      />
                      {item.quantity > 1 && (
                        <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
                          x{item.quantity}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 truncate font-medium">{item.title}</p>
                  </div>
                ))}
              </div>

              {/* Live Tracking Map for both Buyer and Seller */}
              {order.status === 'delivering' && (
                <LiveTrackingMap order={order} appLang={appLang} />
              )}

              <div className="border-t border-slate-50 pt-4 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <p className="text-slate-600 text-sm">{order.items.length} {t(appLang, 'items')}</p>
                  <p className="text-indigo-600 font-bold">{formatPrice(order.total, order.currency)}</p>
                </div>

                {/* Seller Actions */}
                {userRole === 'seller' && order.status === 'pending' && (
                  <button 
                    onClick={() => handleStartDelivery(order.id, user?.uid)}
                    className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                  >
                    <Navigation className="w-5 h-5" /> {t(appLang, 'startDelivery')}
                  </button>
                )}
                
                {/* Delivery Actions */}
                {userRole === 'delivery' && order.status === 'pending' && (
                  <button 
                    onClick={() => handleAcceptDelivery(order.id)}
                    className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                  >
                    <Navigation className="w-5 h-5" /> {t(appLang, 'acceptDelivery')}
                  </button>
                )}

                {userRole === 'seller' && order.status === 'delivering' && (
                  <button 
                    onClick={async () => {
                      stopDelivery(order.id);
                      await setDoc(doc(db, 'orders', order.id), { status: 'delivered' }, { merge: true });
                    }}
                    className="w-full bg-emerald-600 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" /> {t(appLang, 'markAsDelivered')}
                  </button>
                )}

                {userRole === 'delivery' && order.status === 'delivering' && (
                  <button 
                    onClick={async () => {
                      stopDelivery(order.id);
                      await setDoc(doc(db, 'orders', order.id), { status: 'delivered' }, { merge: true });
                    }}
                    className="w-full bg-emerald-600 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" /> {t(appLang, 'markAsDelivered')}
                  </button>
                )}

                {/* Buyer Actions: Rate Order */}
                {userRole === 'buyer' && order.status === 'delivered' && !order.isRated && (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-slate-700 text-center">{t(appLang, 'rateYourExperience')}</p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star}
                          onClick={async () => {
                            await setDoc(doc(db, 'orders', order.id), { isRated: true, rating: star }, { merge: true });
                            showToast(t(appLang, 'thankYouForRating'));
                          }}
                          className="p-2 hover:scale-110 transition-transform"
                        >
                          <Star className="w-8 h-8 text-amber-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seller View: Buyer Location (Hidden after rating) */}
                {userRole === 'seller' && order.buyerLocation && !order.isRated && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-bold text-slate-700">{t(appLang, 'buyerLocation')}</span>
                      </div>
                      <a 
                        href={`https://www.google.com/maps?q=${order.buyerLocation.latitude},${order.buyerLocation.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        {t(appLang, 'openInMaps')}
                      </a>
                    </div>
                    <div className="h-32 rounded-xl overflow-hidden border border-slate-200 relative">
                      <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 text-center px-4">
                        {t(appLang, 'locationPreview')} <br/> ({order.buyerLocation.latitude.toFixed(4)}, {order.buyerLocation.longitude.toFixed(4)})
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
          <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500">{t(appLang, 'noOrders')}</p>
        </div>
      )}
    </motion.div>
  );
};



const ChatScreen = ({ appLang, activeSeller, chatProduct, user, userRole, setActiveSeller, setChatProduct }: any) => (
  <motion.div 
    key="chat"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="w-full"
  >
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-slate-900">{t(appLang, 'liveChatTranslation')}</h1>
      <p className="text-slate-500 mt-2">{t(appLang, 'realTimeChat')}</p>
    </div>
    <ChatSystem 
      activeSeller={activeSeller}
      chatProduct={chatProduct}
      appLang={appLang}
      user={user}
      userRole={userRole}
      onSelectSeller={(seller: any) => setActiveSeller(seller)}
      onBackToInbox={() => { setActiveSeller(null); setChatProduct(null); }}
    />
  </motion.div>
);

const ProductDetail = ({ 
  selectedProduct, 
  setSelectedProduct, 
  favorites, 
  toggleFavorite, 
  formatPrice, 
  appLang, 
  languages, 
  selectedColor, 
  setSelectedColor, 
  selectedSize, 
  setSelectedSize, 
  addToCart, 
  setActiveTab, 
  setChatProduct,
  setActiveSeller,
  user,
  isAdmin,
  handleDeleteProduct,
  openEditProduct
}: any) => {
  const [activeMedia, setActiveMedia] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  const mediaList: any[] = [];
  if (selectedProduct) {
    if (selectedProduct.video) mediaList.push({ type: 'video', url: selectedProduct.video });
    if (selectedProduct.images && selectedProduct.images.length > 0) {
      selectedProduct.images.forEach((img: string) => mediaList.push({ type: 'image', url: img }));
    } else if (selectedProduct.image) {
      mediaList.push({ type: 'image', url: selectedProduct.image });
    }
  }

  React.useEffect(() => {
    if (mediaList.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      setActiveMedia((prev) => (prev + 1) % mediaList.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [mediaList.length, isPaused]);

  if (!selectedProduct) return null;
  const isSaved = favorites.has(selectedProduct.id);

  return (
    <motion.div 
      key="detail"
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-white flex flex-col lg:flex-row overflow-hidden"
    >
      {/* Mobile Header (Absolute) */}
      <div className="lg:hidden absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/50 to-transparent">
        <button 
          onClick={() => setSelectedProduct(null)}
          className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={(e) => toggleFavorite(selectedProduct.id, e)}
          className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      {/* Image Section */}
      <div 
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative w-full lg:w-1/2 h-[50vh] lg:h-full shrink-0 bg-slate-100 flex flex-col"
      >
        <div className="flex-1 relative w-full h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMedia}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            >
              {mediaList[activeMedia]?.type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  {mediaList[activeMedia].url.includes('youtube.com') || mediaList[activeMedia].url.includes('youtu.be') ? (
                    <iframe 
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${mediaList[activeMedia].url.split('v=')[1]?.split('&')[0] || mediaList[activeMedia].url.split('youtu.be/')[1]}`}
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  ) : mediaList[activeMedia].url.includes('tiktok.com') ? (
                    <a href={mediaList[activeMedia].url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-white hover:text-indigo-400 transition-colors">
                      <Video className="w-16 h-16 mb-4" />
                      <span className="font-bold">Watch on TikTok</span>
                    </a>
                  ) : (
                    <a href={mediaList[activeMedia].url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-white hover:text-indigo-400 transition-colors">
                      <Video className="w-16 h-16 mb-4" />
                      <span className="font-bold">Watch Video</span>
                    </a>
                  )}
                </div>
              ) : (
                <img 
                  src={mediaList[activeMedia]?.url || selectedProduct.image} 
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover lg:object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {mediaList.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-3 px-4">
            <div className="flex justify-center gap-2 overflow-x-auto max-w-full hide-scrollbar py-1">
              {mediaList.map((media, idx) => (
                <button 
                  key={idx}
                  onClick={() => {
                    setActiveMedia(idx);
                    setIsPaused(true);
                  }}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${activeMedia === idx ? 'border-indigo-600 scale-110 shadow-lg' : 'border-white/50 opacity-70 hover:opacity-100'}`}
                >
                  {media.type === 'video' ? (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <Video className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <img src={media.url} className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
            
            {/* Slideshow Progress Bar */}
            <div className="flex gap-1 w-32 h-1 bg-white/20 rounded-full overflow-hidden">
              {mediaList.map((_, idx) => (
                <div key={idx} className="flex-1 h-full relative bg-white/10">
                  {activeMedia === idx && !isPaused && (
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3, ease: 'linear' }}
                      className="absolute inset-0 bg-white"
                    />
                  )}
                  {activeMedia === idx && isPaused && (
                    <div className="absolute inset-0 bg-white/60" />
                  )}
                  {activeMedia > idx && (
                    <div className="absolute inset-0 bg-white" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Desktop Close Button */}
        <button 
          onClick={() => setSelectedProduct(null)}
          className="hidden lg:flex absolute top-6 left-6 w-12 h-12 bg-white rounded-full items-center justify-center text-slate-900 shadow-md hover:bg-slate-50 transition-colors z-20"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

        {/* Content Section */}
        <div className="flex-1 bg-white -mt-6 lg:mt-0 rounded-t-[2rem] lg:rounded-none relative z-10 flex flex-col h-[calc(50vh+1.5rem)] lg:h-full">
          <div className="lg:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full"></div>
          
          <div className="flex-1 overflow-y-auto px-6 pt-8 lg:pt-12 pb-32 lg:pb-8 hide-scrollbar">
            <div className="max-w-xl mx-auto">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">{t(appLang, `cat${selectedProduct.category}`)}</p>
                  <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
                    {selectedProduct.name}
                  </h1>
                </div>
                <button 
                  onClick={(e) => toggleFavorite(selectedProduct.id, e)}
                  className="hidden lg:flex w-12 h-12 bg-slate-50 rounded-full items-center justify-center text-slate-900 hover:bg-slate-100 transition-colors shrink-0 ml-4"
                >
                  <Heart className={`w-6 h-6 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  {selectedProduct.discountPrice != null ? (
                    <>
                      <p className="text-indigo-600 font-bold text-3xl">{formatPrice(selectedProduct.discountPrice, selectedProduct.currency)}</p>
                      <p className="text-slate-400 text-lg line-through">{formatPrice(selectedProduct.price, selectedProduct.currency)}</p>
                    </>
                  ) : (
                    <p className="text-indigo-600 font-bold text-3xl">{formatPrice(selectedProduct.price, selectedProduct.currency)}</p>
                  )}
                </div>
                <div className="flex items-center bg-amber-50 px-3 py-1 rounded-full text-amber-600 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-500 mr-1" />
                  {selectedProduct.rating} <span className="font-normal text-amber-600/70 ml-1">({selectedProduct.reviews})</span>
                </div>
              </div>

              {/* Seller Info */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl mb-6 border border-slate-100">
                <img src={selectedProduct.seller.avatar} alt={selectedProduct.seller.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{selectedProduct.seller.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Globe className="w-3 h-3" /> Speaks {languages[selectedProduct.seller.language]}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-6 mb-8">
                {selectedProduct.colors && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3">{t(appLang, 'color')}</h3>
                    <div className="flex gap-3">
                      {selectedProduct.colors.map(color => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color ? 'border-indigo-600 scale-110' : 'border-transparent shadow-sm'}`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select color ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {selectedProduct.sizes && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-bold text-slate-900">{t(appLang, 'size')}</h3>
                      <button className="text-indigo-600 text-xs font-medium hover:underline">{t(appLang, 'sizeGuide')}</button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {selectedProduct.sizes.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`w-12 h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center border ${
                            selectedSize === size 
                              ? 'bg-slate-900 text-white border-slate-900' 
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{t(appLang, 'description')}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {selectedProduct.description}
                </p>
              </div>
            </div>
          </div>

              {/* Action Bar (Sticky Bottom) */}
          <div className="absolute lg:relative bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 sm:p-6 flex justify-center z-20">
            <div className="max-w-xl w-full flex gap-3 sm:gap-4">
              <button 
                onClick={() => {
                  setActiveSeller(selectedProduct.seller);
                  setChatProduct(selectedProduct);
                  setActiveTab('Chat');
                  setSelectedProduct(null);
                }}
                className="flex-1 bg-indigo-50 text-indigo-600 rounded-full py-3 sm:py-4 font-bold text-sm sm:text-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" /> <span className="hidden sm:inline">{t(appLang, 'chatWithSeller')}</span><span className="sm:hidden">{t(appLang, 'chat')}</span>
              </button>
              <button 
                onClick={() => addToCart(selectedProduct)}
                className="flex-1 bg-slate-900 text-white rounded-full py-3 sm:py-4 font-bold text-sm sm:text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" /> <span className="hidden sm:inline">{t(appLang, 'addToCart')}</span><span className="sm:hidden">{t(appLang, 'add')}</span>
              </button>
              {user && (user.uid === selectedProduct.seller.id || isAdmin) && (
                <>
                  <button 
                    onClick={() => openEditProduct(selectedProduct)}
                    className="bg-indigo-50 text-indigo-600 rounded-full p-3 sm:p-4 hover:bg-indigo-100 transition-colors flex items-center justify-center"
                    title="Edit Product"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(selectedProduct.id)}
                    className="bg-red-50 text-red-600 rounded-full p-3 sm:p-4 hover:bg-red-100 transition-colors flex items-center justify-center"
                    title="Delete Product"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

const AddressesScreen = ({ 
  userAddresses, 
  appLang, 
  setProfileView, 
  setShowAddAddress, 
  showAddAddress, 
  handleDeleteAddress, 
  handleSaveAddress, 
  setSelectedLocation, 
  showToast 
}: any) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="max-w-2xl mx-auto w-full"
  >
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setProfileView('main')} 
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
          <span className="font-bold text-slate-600 text-sm">{t(appLang, 'back')}</span>
        </button>
        <h2 className="text-2xl font-bold text-slate-900">{t(appLang, 'shippingAddresses')}</h2>
      </div>
      <button 
        onClick={() => setShowAddAddress(true)}
        className="p-2 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>

    {userAddresses.length > 0 ? (
      <div className="space-y-4">
        {userAddresses.map((addr: any) => (
          <div key={addr.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">{addr.fullName}</p>
                    {addr.isDefault && <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{t(appLang, 'defaultAddress')}</span>}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{addr.phone}</p>
                  <p className="text-sm text-slate-600 mt-2">{addr.addressLine}, {addr.city}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteAddress(addr.id)}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
        <MapPin className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-slate-500">{t(appLang, 'noAddresses')}</p>
      </div>
    )}

    {showAddAddress && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowAddAddress(false)}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
        >
          <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
            <h3 className="text-2xl font-bold text-slate-900">{t(appLang, 'addNewAddress')}</h3>
            <button onClick={() => setShowAddAddress(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
          <div className="p-6 sm:p-8 overflow-y-auto hide-scrollbar flex-1">
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t(appLang, 'fullName')}</label>
                <input name="fullName" required className="w-full bg-slate-50 border-none rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-indigo-600" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t(appLang, 'phone')}</label>
                <input name="phone" required className="w-full bg-slate-50 border-none rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-indigo-600" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t(appLang, 'addressLine')}</label>
                <input name="addressLine" required className="w-full bg-slate-50 border-none rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-indigo-600" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t(appLang, 'city')}</label>
                <input name="city" required className="w-full bg-slate-50 border-none rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-indigo-600" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t(appLang, 'pickLocation')}</label>
                <LocationPicker onLocationSelect={(lat, lng) => setSelectedLocation([lat, lng])} appLang={appLang} showToast={showToast} />
              </div>
              <div className="flex items-center gap-3 py-2">
                <input type="checkbox" name="isDefault" id="isDefault" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                <label htmlFor="isDefault" className="text-sm font-medium text-slate-600">{t(appLang, 'defaultAddress')}</label>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 mt-4">
                {t(appLang, 'saveAddress')}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    )}
  </motion.div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [appLang, setAppLang] = useState<LanguageCode>('my'); // Default to Burmese as requested
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'buyer' | 'seller' | 'delivery'>('buyer');
  const [isPremium, setIsPremium] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [profileView, setProfileView] = useState<'main' | 'orders' | 'addresses' | 'payments' | 'settings' | 'help' | 'privacy' | 'account' | 'security'>('main');
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<any>(null);
  const [isDelivering, setIsDelivering] = useState(false);
  const deliveryWatchId = useRef<number | null>(null);

  const isAdmin = user?.email === "bmyanmar61@gmail.com";
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentDetails, setPaymentDetails] = useState('');
  
  // Chat State
  const [activeSeller, setActiveSeller] = useState<Seller | null>(null);
  const [chatProduct, setChatProduct] = useState<Product | null>(null);

  // E-commerce State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // Product Detail State
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productImagesBase64, setProductImagesBase64] = useState<string[]>([]);
  const [productVideoLink, setProductVideoLink] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [addProductCategory, setAddProductCategory] = useState('Clothing');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string, type: 'product' | 'address' } | null>(null);

  const openEditProduct = (product: any) => {
    setEditingProduct(product);
    setAddProductCategory(categories.includes(product.category) ? product.category : 'Other');
    if (!categories.includes(product.category)) {
      setCustomCategory(product.category);
    }
    setProductImagesBase64(product.images || (product.image ? [product.image] : []));
    setProductVideoLink(product.video || '');
    setShowAddProduct(true);
  };

  const closeAddProduct = () => {
    setShowAddProduct(false);
    setEditingProduct(null);
    setProductImagesBase64([]);
    setProductVideoLink('');
    setCustomCategory('');
    setAddProductCategory('Clothing');
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality JPEG
        };
        img.onerror = error => reject(error);
      };
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (files.length + productImagesBase64.length > 5) {
      showToast('You can only upload up to 5 images.');
      return;
    }

    setIsUploading(true);
    showToast('Processing images...');
    
    try {
      const compressedImages = await Promise.all(files.map(file => compressImage(file as File)));
      setProductImagesBase64(prev => [...prev, ...compressedImages]);
    } catch (error) {
      console.error('Error compressing images:', error);
      showToast('Failed to process some images.');
    } finally {
      setIsUploading(false);
    }
  };
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [lastAdTime, setLastAdTime] = useState(Date.now());

  // Auth Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        const profileData = {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          lastLogin: new Date().toISOString()
        };

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role || 'buyer');
          setPaymentDetails(userData.paymentDetails || '');
          setIsPremium(userData.isPremium || false);
          setPremiumStatus(userData.premiumStatus || 'none');
          if (userData.language) {
            setAppLang(userData.language as LanguageCode);
          }
          // Sync profile data (Clerk/Supabase pattern)
          await setDoc(userRef, profileData, { merge: true });
          setUser({ ...currentUser, ...userData, ...profileData });
        } else {
          // Create user profile (Firebase Quickstart pattern)
          const newUser = {
            ...profileData,
            role: 'buyer',
            language: appLang,
            isPremium: false,
            premiumStatus: 'none',
            createdAt: new Date().toISOString(),
            bio: ''
          };
          await setDoc(userRef, newUser);
          setUserRole('buyer');
          setIsPremium(false);
          setPremiumStatus('none');
          setUser({ ...currentUser, ...newUser });
        }
      } else {
        setUser(null);
        setIsPremium(false);
        setPremiumStatus('none');
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Fetch pending premium requests for admin
  useEffect(() => {
    if (isAdmin && isAuthReady) {
      const q = query(collection(db, 'users'), where('premiumStatus', '==', 'pending'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setPendingUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [isAdmin, isAuthReady]);

  // Fetch user orders
  useEffect(() => {
    if (user && isAuthReady) {
      const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUserOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [user, isAuthReady]);

  // Fetch user addresses
  useEffect(() => {
    if (user && isAuthReady) {
      const q = query(collection(db, 'addresses'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUserAddresses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [user, isAuthReady]);

  // Products Effect
  useEffect(() => {
    if (!isAuthReady) return;
    
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts: Product[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedProducts.push({
          id: doc.id,
          name: data.title || 'Untitled Product',
          price: data.price || 0,
          discountPrice: data.discountPrice,
          currency: data.currency || 'MMK',
          category: data.category || 'Other',
          image: data.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=500&auto=format&fit=crop',
          images: data.images || [],
          videos: data.video ? [data.video] : [],
          description: data.description || '',
          rating: 5.0,
          reviews: 0,
          createdAt: data.createdAt,
          seller: {
            id: data.sellerId,
            name: data.sellerName || 'Seller',
            avatar: data.sellerPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
            language: 'en',
            shopLocation: data.sellerLocation || null
          }
        });
      });
      setProducts(fetchedProducts);
    }, (error) => {
      console.error('Error fetching products:', error);
      if (error.message.includes('permission-denied')) {
        showToast('Access denied to products. Please check permissions.');
      }
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
      showToast('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCart([]);
      setFavorites(new Set());
      setActiveTab('Home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLanguageChange = async (lang: LanguageCode) => {
    setAppLang(lang);
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { language: lang }, { merge: true });
      } catch (error) {
        console.error('Error updating language:', error);
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleRole = async () => {
    if (!user) return;
    const roles: ('buyer' | 'seller' | 'delivery')[] = ['buyer', 'seller', 'delivery'];
    const currentIndex = roles.indexOf(userRole);
    const newRole = roles[(currentIndex + 1) % roles.length];
    try {
      await setDoc(doc(db, 'users', user.uid), { role: newRole }, { merge: true });
      setUserRole(newRole);
      showToast(`${t(appLang, 'switchedTo')} ${newRole} ${t(appLang, 'account')}`);
    } catch (error) {
      console.error('Error switching role:', error);
      showToast('Failed to switch role');
    }
  };

  const handleRequestPremium = async () => {
    if (!user) {
      showToast(t(appLang, 'loginToRequestPremium'));
      return;
    }
    
    try {
      await setDoc(doc(db, 'users', user.uid), { premiumStatus: 'pending' }, { merge: true });
      showToast(t(appLang, 'premiumRequestSent'));
    } catch (error) {
      console.error('Error requesting premium:', error);
      showToast(t(appLang, 'premiumRequestFail'));
    }
  };

  const handleApprovePremium = async (targetUserId: string) => {
    try {
      await setDoc(doc(db, 'users', targetUserId), { 
        premiumStatus: 'approved',
        isPremium: true 
      }, { merge: true });
      showToast(t(appLang, 'userApproved'));
    } catch (error) {
      console.error('Error approving premium:', error);
      showToast(t(appLang, 'approveFail'));
    }
  };

  const handleRejectPremium = async (targetUserId: string) => {
    try {
      await setDoc(doc(db, 'users', targetUserId), { 
        premiumStatus: 'rejected',
        isPremium: false 
      }, { merge: true });
      showToast(t(appLang, 'userRejected'));
    } catch (error) {
      console.error('Error rejecting premium:', error);
      showToast(t(appLang, 'rejectFail'));
    }
  };

  const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;
    const phone = formData.get('phone') as string;
    const addressLine = formData.get('addressLine') as string;
    const city = formData.get('city') as string;
    const isDefault = formData.get('isDefault') === 'on';

    try {
      const addressRef = doc(collection(db, 'addresses'));
      await setDoc(addressRef, {
        userId: user.uid,
        fullName,
        phone,
        addressLine,
        city,
        isDefault,
        latitude: selectedLocation ? selectedLocation[0] : null,
        longitude: selectedLocation ? selectedLocation[1] : null,
        createdAt: new Date().toISOString()
      });
      setShowAddAddress(false);
      setSelectedLocation(null);
      showToast(t(appLang, 'addressSavedSuccess'));
    } catch (error) {
      console.error('Error saving address:', error);
      showToast(t(appLang, 'addressSavedFail'));
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    setDeleteConfirmation({ id: addressId, type: 'address' });
  };

  const watchAd = () => {
    setIsWatchingAd(true);
    setLastAdTime(Date.now());
    // In a real app, you would call an ad SDK here (e.g., Google AdMob or AdSense)
    // to show a real interstitial ad and earn revenue.
    setTimeout(() => {
      setIsWatchingAd(false);
      showToast(t(appLang, 'adFinished'));
    }, 5000); // 5 seconds ad
  };

  // Forced Ad Logic: Check every 30 seconds if an ad should be shown
  useEffect(() => {
    if (isPremium || !isAuthReady) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastAd = now - lastAdTime;
      
      // Show ad every 3 minutes (180000ms) of active use
      if (timeSinceLastAd > 180000 && !isWatchingAd && activeTab !== 'Chat') {
        watchAd();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isPremium, lastAdTime, isWatchingAd, isAuthReady, activeTab]);


  // Reset selections when product changes
  useEffect(() => {
    if (selectedProduct) {
      setSelectedColor(selectedProduct.colors?.[0]);
      setSelectedSize(selectedProduct.sizes?.[0]);
    }
  }, [selectedProduct]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      return;
    }
    const q = query(collection(db, 'favorites'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const favs = new Set<string>();
      snapshot.docs.forEach(doc => {
        favs.add(doc.data().productId);
      });
      setFavorites(favs);
    }, (error) => {
      console.error('Error fetching favorites:', error);
    });
    return () => unsubscribe();
  }, [user]);

  const toggleFavorite = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) {
      showToast('Please login to save favorites');
      return;
    }

    try {
      if (favorites.has(id)) {
        // Find the document to delete
        const q = query(collection(db, 'favorites'), where('userId', '==', user.uid), where('productId', '==', id));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(async (docSnapshot) => {
          await deleteDoc(doc(db, 'favorites', docSnapshot.id));
        });
        showToast('Removed from favorites');
      } else {
        await addDoc(collection(db, 'favorites'), {
          userId: user.uid,
          productId: id,
          createdAt: Date.now()
        });
        showToast('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('Failed to update favorites');
    }
  };

  const addToCart = (product: Product) => {
    if (product.colors && !selectedColor) {
      showToast('Please select a color');
      return;
    }
    if (product.sizes && !selectedSize) {
      showToast('Please select a size');
      return;
    }

    const newItem: CartItem = {
      ...product,
      cartItemId: Date.now().toString(),
      quantity: 1,
      selectedColor,
      selectedSize
    };

    setCart(prev => [...prev, newItem]);
    showToast('Added to cart');
    setSelectedProduct(null); // Close detail view
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
    showToast('Item removed from cart');
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const filteredProducts = useMemo(() => {
    const predefinedCategories = ['Clothing', 'Shoes', 'Accessories', 'Electronics', 'Home', 'Food', 'Beauty', 'Health'];
    return products.filter(p => {
      const name = p.name || '';
      const matchesCategory = selectedCategory === 'All' || 
                             (selectedCategory === 'Other' ? !predefinedCategories.includes(p.category) : p.category === selectedCategory);
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Format currency
  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  // --- SCREENS ---

  const handleProductSelect = (product: Product) => {
    // Show ad 30% of the time when opening a product for non-premium users
    if (!isPremium && Math.random() < 0.3) {
      watchAd();
    }
    setSelectedProduct(product);
  };



  const handleCheckout = async () => {
    if (!user) {
      showToast(t(appLang, 'signInToCheckout'));
      return;
    }
    if (cart.length === 0) return;

    const orderTotal = cartTotal * 1.08;
    const currency = cart[0]?.currency;
    const sellerIds = Array.from(new Set(cart.map(item => item.seller?.id).filter(Boolean)));

    try {
      const orderRef = doc(collection(db, 'orders'));
      await setDoc(orderRef, {
        userId: user.uid,
        buyerName: user.displayName || 'Buyer',
        buyerPhoto: user.photoURL || '',
        buyerLocation: user.homeLocation || null,
        sellerIds,
        items: cart.map(item => ({
          productId: item.id,
          title: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        total: orderTotal,
        currency,
        status: 'pending',
        address: userAddresses.find(a => a.isDefault) || userAddresses[0] || {},
        createdAt: new Date().toISOString()
      });
      
      showToast(t(appLang, 'orderPlacedSuccess'));
      setCart([]);
    } catch (error) {
      console.error('Error creating order:', error);
      showToast(t(appLang, 'orderPlacedFail'));
    }
  };

  // Fetch seller orders
  useEffect(() => {
    if (user && userRole === 'seller') {
      const q = query(
        collection(db, 'orders'), 
        where('sellerIds', 'array-contains', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSellerOrders(orders);
      }, (error) => {
        console.error('Error fetching seller orders:', error);
      });
      return () => unsubscribe();
    }
  }, [user, userRole]);

  const handleStartDelivery = async (orderId: string, deliveryPersonId?: string) => {
    if (!navigator.geolocation) {
      showToast(t(appLang, 'geoNotSupported'));
      return;
    }

    setIsDelivering(true);
    showToast(t(appLang, 'startDeliveryMsg'));

    if (deliveryWatchId.current !== null) {
      navigator.geolocation.clearWatch(deliveryWatchId.current);
    }

    deliveryWatchId.current = navigator.geolocation.watchPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const updateData: any = {
          status: 'delivering',
          sellerLocation: {
            latitude,
            longitude,
            updatedAt: new Date().toISOString()
          }
        };
        if (deliveryPersonId) {
          updateData.deliveryPersonId = deliveryPersonId;
        }
        await setDoc(doc(db, 'orders', orderId), updateData, { merge: true });

        // Add delivery person to chat participants if they are not already there
        const orderDoc = await getDocs(query(collection(db, 'orders'), where('id', '==', orderId)));
        if (!orderDoc.empty) {
          const orderData = orderDoc.docs[0].data();
          const q = query(
            collection(db, 'chats'),
            where('buyerId', '==', orderData.buyerId),
            where('productId', '==', orderData.items[0].id) // Assuming one product for now or first item
          );
          const chatSnapshot = await getDocs(q);
          if (!chatSnapshot.empty) {
            const chatDoc = chatSnapshot.docs[0];
            const chatData = chatDoc.data();
            if (!chatData.participants.includes(user.uid)) {
              await updateDoc(doc(db, 'chats', chatDoc.id), {
                participants: [...chatData.participants, user.uid],
                deliveryId: user.uid
              });
            }
          }
        }
      } catch (error) {
        console.error('Error updating delivery location or chat:', error);
      }
    }, (error) => {
      console.error('Geolocation error:', error);
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 });
  };

  const stopDelivery = (orderId: string) => {
    if (deliveryWatchId.current !== null) {
      navigator.geolocation.clearWatch(deliveryWatchId.current);
      deliveryWatchId.current = null;
    }
    setIsDelivering(false);
    showToast(t(appLang, 'deliveryCompleted'));
  };

  const handleAcceptDelivery = async (orderId: string) => {
    try {
      await setDoc(doc(db, 'orders', orderId), {
        status: 'delivering',
        deliveryPersonId: user.uid,
        deliveryPersonName: user.displayName,
      }, { merge: true });
      showToast(t(appLang, 'deliveryAccepted'));
    } catch (error) {
      console.error('Error accepting delivery:', error);
      showToast('Failed to accept delivery');
    }
  };

const FavoritesScreen = ({ 
  favorites, 
  products, 
  appLang, 
  toggleFavorite, 
  formatPrice, 
  handleProductSelect, 
  setActiveTab 
}: any) => {
  const favoriteProducts = products.filter((p: any) => favorites.has(p.id));
  return (
    <motion.div 
      key="favorites"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col"
    >
      <h1 className="text-3xl font-bold text-slate-900 mb-6">{t(appLang, 'savedItems')}</h1>
      
      {favoriteProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{t(appLang, 'noSavedItems')}</h3>
          <button 
            onClick={() => setActiveTab('Home')}
            className="px-8 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors mt-6"
          >
            {t(appLang, 'exploreProducts')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {favoriteProducts.map((product: any, index: number) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleProductSelect(product)}
              className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-sm border border-slate-100 cursor-pointer group flex flex-col"
            >
              <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden mb-4 bg-slate-100">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={(e) => toggleFavorite(product.id, e)}
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full text-slate-900 hover:bg-white transition-colors z-10 shadow-sm"
                >
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-red-500 text-red-500" />
                </button>
              </div>
              <div className="flex flex-col flex-1">
                <h3 className="text-slate-900 font-bold text-sm sm:text-base line-clamp-2 mb-2 flex-1">{product.name}</h3>
                <p className="text-indigo-600 font-bold text-lg">{formatPrice(product.price, product.currency)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};





  const handleDeleteProduct = async (productId: string) => {
    setDeleteConfirmation({ id: productId, type: 'product' });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    const { id, type } = deleteConfirmation;
    
    try {
      if (type === 'product') {
        await deleteDoc(doc(db, 'products', id));
        showToast('Product deleted successfully');
        setSelectedProduct(null);
      } else if (type === 'address') {
        await deleteDoc(doc(db, 'addresses', id));
        showToast(t(appLang, 'addressDeletedSuccess'));
      }
      setDeleteConfirmation(null);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      showToast(`Failed to delete ${type}`);
    }
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    if (userRole !== 'seller') {
      showToast('Only sellers can add products');
      return;
    }
    if (productImagesBase64.length === 0) {
      showToast('Please select at least one image for your product');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const discountPriceStr = formData.get('discountPrice') as string;
    const discountPrice = discountPriceStr ? parseFloat(discountPriceStr) : null;
    const currency = formData.get('currency') as string;
    const category = addProductCategory === 'Other' ? customCategory : addProductCategory;

    if (!category) {
      showToast('Please specify a category');
      return;
    }

    if (discountPrice !== null && discountPrice >= price) {
      showToast('Discount price must be less than the original price.');
      return;
    }

    setIsUploading(true);

    try {
      const productData: any = {
        title,
        description,
        price,
        currency,
        category,
        image: productImagesBase64[0], // Keep primary image for backward compatibility
        images: productImagesBase64,
        video: productVideoLink || null,
        sellerId: user.uid,
        sellerName: user.displayName || 'Seller',
        sellerPhoto: user.photoURL || '',
        sellerLocation: user.shopLocation || null,
        createdAt: editingProduct ? (editingProduct.createdAt || new Date().toISOString()) : new Date().toISOString()
      };

      if (discountPrice !== null) {
        productData.discountPrice = discountPrice;
      }

      if (editingProduct) {
        await setDoc(doc(db, 'products', editingProduct.id), productData, { merge: true });
        showToast('Product updated successfully');
        if (selectedProduct && selectedProduct.id === editingProduct.id) {
          setSelectedProduct({ ...selectedProduct, ...productData });
        }
      } else {
        const newProductRef = doc(collection(db, 'products'));
        await setDoc(newProductRef, productData);
        showToast(t(appLang, 'productAddedSuccess'));
      }
      
      closeAddProduct();
    } catch (error: any) {
      console.error('Error saving product:', error);
      showToast(`Failed: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const renderAddProductModal = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">{editingProduct ? 'Edit Product' : t(appLang, 'addNewProduct')}</h2>
          <button onClick={closeAddProduct} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form id="add-product-form" onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t(appLang, 'productTitle')}</label>
              <input required name="title" type="text" defaultValue={editingProduct?.title || ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., Minimalist Cotton T-Shirt" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t(appLang, 'productDescription')}</label>
              <textarea required name="description" rows={3} defaultValue={editingProduct?.description || ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Describe your product..."></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t(appLang, 'price')}</label>
                <input required name="price" type="number" step="0.01" min="0" defaultValue={editingProduct?.price || ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Discount Price (Optional)</label>
                <input name="discountPrice" type="number" step="0.01" min="0" defaultValue={editingProduct?.discountPrice || ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t(appLang, 'currency')}</label>
              <select name="currency" defaultValue={editingProduct?.currency || 'MMK'} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="MMK">MMK ({t(appLang, 'kyat')})</option>
                <option value="THB">THB ({t(appLang, 'baht')})</option>
                <option value="USD">USD ({t(appLang, 'dollar')})</option>
                <option value="LAK">LAK ({t(appLang, 'kip')})</option>
                <option value="CNY">CNY ({t(appLang, 'yuan')})</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t(appLang, 'category')}</label>
              <select 
                value={addProductCategory}
                onChange={(e) => setAddProductCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{t(appLang, `cat${c}`)}</option>
                ))}
                <option value="Other">{t(appLang, 'other')}</option>
              </select>
              {addProductCategory === 'Other' && (
                <input 
                  required
                  type="text" 
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full mt-2 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="Enter custom category..."
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t(appLang, 'image')} (Up to 5)</label>
              <div className="mt-1 flex flex-col gap-4">
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-2xl hover:border-indigo-400 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1 text-center">
                    <Plus className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600">
                      <span className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                        Upload photos
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">PNG, JPG up to 800KB each</p>
                  </div>
                </div>
                {productImagesBase64.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {productImagesBase64.map((img, idx) => (
                      <div key={idx} className="relative inline-block shrink-0">
                        <img src={img} alt={`Preview ${idx}`} className="h-20 w-20 object-cover rounded-xl" />
                        <button 
                          type="button"
                          onClick={() => setProductImagesBase64(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Video Link (Optional)</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Video className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="url" 
                  value={productVideoLink}
                  onChange={(e) => setProductVideoLink(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Paste TikTok, YouTube, or Facebook video link"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Since large video uploads require a paid Firebase plan, please paste a link to your video instead.
              </p>
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={() => setShowAddProduct(false)}
            className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
            disabled={isUploading}
          >
            {t(appLang, 'cancel')}
          </button>
          <button 
            type="submit"
            form="add-product-form"
            disabled={isUploading}
            className={`px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2 ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              t(appLang, 'listProduct')
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );



  if (!isAuthReady) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100]">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-200 mb-6"
        >
          <ShoppingBag className="w-10 h-10 text-white" />
        </motion.div>
        <div className="flex items-center gap-2 text-slate-400 font-bold tracking-widest uppercase text-xs">
          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-0 left-1/2 z-[100] bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 min-w-[300px]"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm font-medium flex-1 text-center">{toast}</p>
            <button onClick={() => setToast(null)} className="shrink-0"><X className="w-4 h-4 text-slate-400 hover:text-white" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Top Navigation */}
      <header className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-md z-40 border-b border-slate-200 hidden lg:block">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('Home')}>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <ShoppingBag className="w-5 h-5" />
              </div>
              {t(appLang, 'appName')}
            </div>
            <nav className="flex gap-8">
              {['Home', 'Explore', 'Live', 'Chat'].map(item => (
                <button 
                  key={item} 
                  onClick={() => setActiveTab(item)}
                  className={`text-sm font-medium transition-colors ${activeTab === item ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  {item === 'Home' ? t(appLang, 'home') : item === 'Explore' ? t(appLang, 'explore') : item === 'Live' ? t(appLang, 'live') : t(appLang, 'chat')}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 mr-4">
              <Globe className="w-4 h-4 text-slate-400" />
              <select 
                value={appLang} 
                onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
                className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
              >
                {Object.entries(languages).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder={t(appLang, 'searchPlaceholder')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-100 border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
              <button onClick={toggleTheme} className="relative text-slate-600 hover:text-slate-900 transition-colors">
                {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              </button>
              <button onClick={() => setActiveTab('Favorites')} className="relative text-slate-600 hover:text-slate-900 transition-colors">
                <Heart className="w-6 h-6" />
                {favorites.size > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">{favorites.size}</span>}
              </button>
              <button onClick={() => setActiveTab('Cart')} className="relative text-slate-600 hover:text-slate-900 transition-colors">
                <ShoppingBag className="w-6 h-6" />
                {cart.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full">{cart.length}</span>}
              </button>
              <button onClick={() => setActiveTab('Profile')} className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-5 h-5 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 inset-x-0 bg-white/90 backdrop-blur-md z-30 border-b border-slate-200 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400" />
          <select 
            value={appLang} 
            onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
            className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
          >
            {Object.entries(languages).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
        <div className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center text-white">
            <ShoppingBag className="w-4 h-4" />
          </div>
          {t(appLang, 'appName')}
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 text-slate-600 relative" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button className="p-2 -mr-2 text-slate-600 relative" onClick={() => setActiveTab('Cart')}>
            <ShoppingBag className="w-6 h-6" />
            {cart.length > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">{cart.length}</span>}
          </button>
        </div>
      </header>

      {/* Mobile Search Bar (Below Header) */}
      <div className="lg:hidden fixed top-16 inset-x-0 bg-white z-20 px-4 py-3 border-b border-slate-100">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder={t(appLang, 'searchPlaceholder')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 border-none rounded-full pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 lg:pt-28 pb-24 lg:pb-12">
        <AnimatePresence mode="wait">
          {!selectedProduct && activeTab === 'Home' && (
            <HomeScreen 
              products={products}
              filteredProducts={filteredProducts}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              appLang={appLang}
              handleProductSelect={handleProductSelect}
              toggleFavorite={toggleFavorite}
              favorites={favorites}
              formatPrice={formatPrice}
              isPremium={isPremium}
              watchAd={watchAd}
              setActiveSeller={setActiveSeller}
              setActiveTab={setActiveTab}
            />
          )}
          {!selectedProduct && activeTab === 'Explore' && <ExploreScreen products={products} appLang={appLang} setActiveSeller={setActiveSeller} setActiveTab={setActiveTab} />}
          {!selectedProduct && activeTab === 'Live' && <LiveScreen setActiveTab={setActiveTab} appLang={appLang} products={products} setSelectedProduct={setSelectedProduct} />}
          {!selectedProduct && activeTab === 'Chat' && <ChatScreen appLang={appLang} activeSeller={activeSeller} chatProduct={chatProduct} user={user} userRole={userRole} setActiveSeller={setActiveSeller} setChatProduct={setChatProduct} />}
          {!selectedProduct && activeTab === 'Cart' && (
            <CartScreen 
              cart={cart}
              appLang={appLang}
              formatPrice={formatPrice}
              updateCartQuantity={updateCartQuantity}
              removeFromCart={removeFromCart}
              setActiveTab={setActiveTab}
              cartTotal={cartTotal}
              onCheckout={handleCheckout}
            />
          )}
          {!selectedProduct && activeTab === 'Favorites' && (
            <FavoritesScreen 
              favorites={favorites}
              products={products}
              appLang={appLang}
              toggleFavorite={toggleFavorite}
              formatPrice={formatPrice}
              handleProductSelect={handleProductSelect}
              setActiveTab={setActiveTab}
            />
          )}
          {!selectedProduct && activeTab === 'Profile' && (
            <ProfileScreen 
              user={user}
              profileView={profileView}
              userRole={userRole}
              userOrders={userOrders}
              sellerOrders={sellerOrders}
              appLang={appLang}
              formatPrice={formatPrice}
              setProfileView={setProfileView}
              handleStartDelivery={handleStartDelivery}
              stopDelivery={stopDelivery}
              userAddresses={userAddresses}
              setShowAddAddress={setShowAddAddress}
              showAddAddress={showAddAddress}
              handleDeleteAddress={handleDeleteAddress}
              handleSaveAddress={handleSaveAddress}
              setSelectedLocation={setSelectedLocation}
              showToast={showToast}
              paymentDetails={paymentDetails}
              setPaymentDetails={setPaymentDetails}
              languages={languages}
              handleLanguageChange={handleLanguageChange}
              theme={theme}
              toggleTheme={toggleTheme}
              setUser={setUser}
              handleLogin={handleLogin}
              handleLogout={handleLogout}
              favorites={favorites}
              isAdmin={isAdmin}
              pendingUsers={pendingUsers}
              handleApprovePremium={handleApprovePremium}
              handleRejectPremium={handleRejectPremium}
              isPremium={isPremium}
              premiumStatus={premiumStatus}
              handleRequestPremium={handleRequestPremium}
              watchAd={watchAd}
              isWatchingAd={isWatchingAd}
              setShowAddProduct={setShowAddProduct}
              toggleRole={toggleRole}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && <ProductDetail 
          selectedProduct={selectedProduct} 
          setSelectedProduct={setSelectedProduct} 
          favorites={favorites} 
          toggleFavorite={toggleFavorite} 
          formatPrice={formatPrice} 
          appLang={appLang} 
          languages={languages} 
          selectedColor={selectedColor} 
          setSelectedColor={setSelectedColor} 
          selectedSize={selectedSize} 
          setSelectedSize={setSelectedSize} 
          addToCart={addToCart} 
          setActiveTab={setActiveTab} 
          setChatProduct={setChatProduct}
          setActiveSeller={setActiveSeller}
          user={user}
          isAdmin={isAdmin}
          handleDeleteProduct={handleDeleteProduct}
          openEditProduct={openEditProduct}
        />}
      </AnimatePresence>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddProduct && renderAddProductModal()}
      </AnimatePresence>
      
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmation(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl relative z-10 p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {deleteConfirmation.type === 'product' ? t(appLang, 'deleteProductConfirm') : t(appLang, 'deleteAddressConfirm')}
              </h3>
              <p className="text-slate-500 mb-8">
                {deleteConfirmation.type === 'product' ? t(appLang, 'deleteProductWarning') : t(appLang, 'deleteAddressWarning')}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 bg-slate-100 text-slate-900 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  {t(appLang, 'cancel')}
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 text-white font-bold py-4 rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                >
                  {t(appLang, 'delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ad Overlay */}
      <AnimatePresence>
        {isWatchingAd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center text-white p-8"
          >
            <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl relative mb-8">
              <div className="bg-slate-900 p-4 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{t(appLang, 'sponsoredAd')}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-xs font-medium">{t(appLang, 'liveAd')}</span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 min-h-[250px] flex items-center justify-center">
                <AdSenseUnit />
              </div>
              <div className="p-6 bg-white border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h2 className="text-xl font-bold text-slate-900">{t(appLang, 'support')} {t(appLang, 'appName')}</h2>
                    <p className="text-slate-500 text-sm">{t(appLang, 'adSupportText')}</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <Play className="w-6 h-6 text-indigo-600" fill="currentColor" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="relative w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  className="h-full bg-white"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                {t(appLang, 'closingIn')}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {[
            { id: 'Home', icon: Home, label: t(appLang, 'home') },
            { id: 'Explore', icon: MapIcon, label: t(appLang, 'explore') },
            { id: 'Live', icon: Video, label: t(appLang, 'live') },
            { id: 'Chat', icon: MessageCircle, label: t(appLang, 'chat') },
            { id: 'Favorites', icon: Heart, badge: favorites.size, label: t(appLang, 'saved') },
            { id: 'Profile', icon: User, label: t(appLang, 'profile') },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button 
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSelectedProduct(null);
                }}
                className={`relative flex flex-col items-center justify-center w-16 h-full transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-indigo-600/20' : ''}`} />
                  {item.badge ? (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] font-medium truncate w-full text-center px-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
