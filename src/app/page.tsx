
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Vehicle, Staff, Dealership } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/icons';

const ServiceCard = ({ icon, title, description }: { icon: string, title: string, description: string }) => (
    <div className="group flex flex-col gap-5 rounded-2xl border border-[#dbe0e6] dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 hover:shadow-xl hover:border-primary/30 transition-all">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-3xl">{icon}</span>
        </div>
        <div className="flex flex-col gap-2">
            <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight">{title}</h2>
            <p className="text-[#617589] dark:text-gray-400 text-base font-normal leading-relaxed">
                {description}
            </p>
        </div>
    </div>
);

const services = [
    {
        icon: 'search',
        title: 'Vehicle Sourcing',
        description: 'Access to the Houston, Texas network market to find your specific make, model, and trim level, including rare editions.'
    },
    {
        icon: 'payments',
        title: 'Financing Assistance',
        description: 'Competitive rates and simplified paperwork handled by experts to ensure a seamless transaction.'
    },
    {
        icon: 'thumb_up',
        title: 'Great Customer Service',
        description: 'Our team assists with vehicle availability, pricing, financing options, and appointment scheduling.'
    }
];


function FeaturedVehicleCard({ vehicle }: { vehicle: Vehicle }) {
  let imageUrl = 'https://placehold.co/600x400/f0f2f4/9ca3af?text=GS+Auto';
  if (vehicle.photos && vehicle.photos.length > 0 && vehicle.photos[0]) {
    try {
      new URL(vehicle.photos[0]); 
      imageUrl = vehicle.photos[0];
    } catch (error) {
      // Invalid URL, keep placeholder
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-[#dbe0e6] dark:border-gray-700 shadow-sm hover:shadow-xl transition-all group">
      <Link href={`/inventory/vehicle/${vehicle.id}`}>
        <div className="relative h-64 overflow-hidden">
            <Image
                src={imageUrl}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                fill
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 px-3 py-1 rounded-full text-xs font-bold text-primary">Featured</div>
        </div>
      </Link>
      <div className="p-6">
        <Link href={`/inventory/vehicle/${vehicle.id}`}>
            <h3 className="text-xl font-extrabold text-[#111418] dark:text-white mb-4 hover:text-primary transition-colors">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
        </Link>
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Mileage</span>
            <div className="flex items-center gap-1 text-sm font-semibold text-[#111418] dark:text-gray-200">
              <span className="material-symbols-outlined text-xs text-primary">speed</span>
              {vehicle.mileage.toLocaleString()} mi
            </div>
          </div>
          <div className="flex flex-col gap-1 border-x border-gray-100 dark:border-gray-700 px-2">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Fuel</span>
            <div className="flex items-center gap-1 text-sm font-semibold text-[#111418] dark:text-gray-200">
              <span className="material-symbols-outlined text-xs text-primary">local_gas_station</span>
              {vehicle.fuelType}
            </div>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Trans</span>
            <div className="flex items-center justify-end gap-1 text-sm font-semibold text-[#111418] dark:text-gray-200">
              <span className="material-symbols-outlined text-xs text-primary">settings_input_component</span>
              {vehicle.transmission}
            </div>
          </div>
        </div>
        <Link href={`/inventory/vehicle/${vehicle.id}`} className="w-full bg-primary/5 hover:bg-primary hover:text-white text-primary font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
          View Details
        </Link>
      </div>
    </div>
  );
}


function FeaturedListings() {
  const firestore = useFirestore();

  const inventoryQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "inventory"),
      where("status", "==", "Active"),
      orderBy("createdAt", "desc"),
      limit(3)
    );
  }, [firestore]);

  const { data: vehicles, loading } = useCollection<Vehicle>(inventoryQuery);

  return (
    <section className="bg-[#f8f9fb] dark:bg-gray-900/40 py-20" id="listings">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="flex flex-col gap-4">
                    <h2 className="text-primary text-sm font-bold uppercase tracking-widest">Exclusive Inventory</h2>
                    <h1 className="text-[#111418] dark:text-white text-4xl font-extrabold tracking-tight">Our Featured Listings</h1>
                </div>
                <Link href="/inventory" className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all">
                    Browse All Listings <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="h-64 w-full rounded-2xl" />
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))
                ) : vehicles && vehicles.length > 0 ? (
                    vehicles.map(vehicle => (
                        <FeaturedVehicleCard key={vehicle.id} vehicle={vehicle} />
                    ))
                ) : (
                    <p className="col-span-3 text-center text-muted-foreground">No featured vehicles available at the moment.</p>
                )}
            </div>
        </div>
    </section>
  )
}

function QuickInquiryForm() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [interest, setInterest] = useState('Vehicle Sourcing');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const firestore = useFirestore();

    const ownerQuery = useMemo(() => firestore ? query(collection(firestore, "staff"), where("role", "==", "Admin"), limit(1)) : null, [firestore]);
    const { data: owners } = useCollection<Staff>(ownerQuery);

    const dealershipQuery = useMemo(() => firestore ? query(collection(firestore, "dealerships"), limit(1)) : null, [firestore]);
    const { data: dealerships } = useCollection<Dealership>(dealershipQuery);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;
        if (!name || !phone) {
            toast({ title: "Missing Information", description: "Please provide your name and phone number.", variant: "destructive" });
            return;
        }

        const defaultOwner = owners?.[0];
        const defaultDealership = dealerships?.[0];

        if (!defaultOwner || !defaultDealership) {
            toast({ title: "System Error", description: "Default owner or dealership not configured. Cannot create lead.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);

        try {
            const leadsCollection = collection(firestore, 'leads');
            const newLeadData = {
                name,
                phone,
                channel: 'Website Inquiry',
                stage: 'Nuevo',
                language: 'English',
                ownerId: defaultOwner.id,
                ownerName: defaultOwner.name,
                dealershipId: defaultDealership.id,
                dealershipName: defaultDealership.name,
                createdAt: serverTimestamp(),
                lastActivity: serverTimestamp(),
            };

            const newLeadRef = await addDoc(leadsCollection, newLeadData as any);

            const noteHistoryRef = collection(firestore, 'leads', newLeadRef.id, 'noteHistory');
            const initialNote = `Inquiry from website.\nInterest: ${interest}.\nMessage: ${message}`;

            await addDoc(noteHistoryRef, {
                content: initialNote,
                author: 'System',
                date: serverTimestamp(),
                type: 'System',
            });
            
            toast({ title: "Inquiry Sent!", description: "Thank you! A member of our team will contact you shortly." });
            setName('');
            setPhone('');
            setMessage('');
            setInterest('Vehicle Sourcing');

        } catch (error) {
            console.error(error);
            toast({ title: "Submission Failed", description: "Could not send your inquiry. Please try again later.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="John Doe" type="text" />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Phone</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="+1 (555) 000-0000" type="tel" />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Interested In</label>
                <select value={interest} onChange={(e) => setInterest(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none text-sm">
                    <option>Vehicle Sourcing</option>
                    <option>Financing Assistance</option>
                    <option>General Inquiry</option>
                </select>
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Message</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none text-sm resize-none" placeholder="Tell us about the vehicle you're looking for..." rows={4}></textarea>
            </div>
            <button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all mt-4 flex items-center justify-center">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
        </form>
    );
}

export default function LandingPage() {
    const customerAvatars = PlaceHolderImages.slice(0, 3); // Get first 3 users for avatars
    const { toast } = useToast();

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'GS Autobrokers',
                    text: 'Check out the amazing vehicles at GS Autobrokers!',
                    url: window.location.href,
                });
            } catch (error) {
                console.error('Error sharing:', error);
                // User probably cancelled the share action, so no need for an error toast.
            }
        } else {
            // Fallback for browsers that don't support the Share API
            navigator.clipboard.writeText(window.location.href);
            toast({ title: "Link Copied!", description: "The page URL has been copied to your clipboard." });
        }
    };


    return (
        <div className="bg-background-light dark:bg-background-dark text-[#111418] dark:text-white antialiased">
            <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-[#f0f2f4] dark:border-gray-800">
                <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
                    <Logo />
                    <nav className="hidden md:flex items-center gap-10">
                        <a className="text-[#111418] dark:text-gray-300 text-sm font-semibold hover:text-primary transition-colors" href="#">Home</a>
                        <a className="text-[#111418] dark:text-gray-300 text-sm font-semibold hover:text-primary transition-colors" href="#services">Services</a>
                        <Link className="text-[#111418] dark:text-gray-300 text-sm font-semibold hover:text-primary transition-colors" href="/inventory">Inventory</Link>
                        <a className="text-[#111418] dark:text-gray-300 text-sm font-semibold hover:text-primary transition-colors" href="#contact">Contact</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm">
                            Broker Access
                        </Link>
                    </div>
                </div>
            </header>
            <main>
                <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 md:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="order-2 lg:order-1 flex flex-col gap-8">
                            <div className="flex flex-col gap-4">
                                <h1 className="text-[#111418] dark:text-white text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight">
                                    Vehicle Brokerage <span className="text-primary">Made Simple</span>
                                </h1>
                                <p className="text-[#617589] dark:text-gray-400 text-lg md:text-xl font-normal leading-relaxed max-w-[540px]">
                                    We handle the sourcing, negotiation, and financing according to our customers´ needs and budget.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <a href="#contact" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl text-base font-bold transition-all shadow-lg shadow-primary/20">
                                    Schedule a Testdrive
                                </a>
                                <Link href="/inventory" className="bg-white dark:bg-gray-800 border border-[#dbe0e6] dark:border-gray-700 px-8 py-4 rounded-xl text-base font-bold hover:bg-gray-50 transition-all">
                                    View Our Inventory
                                </Link>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                                <img className="w-full h-full object-cover" alt="Luxury black sport sedan" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAW8qwR1QFDlNtFay3FowX4CLtETin5kobnN8-sjj8jAvUlvVXgRnP87eUjXxpyOzsrxuht8hjlBeC9Tc0L5x2RxbbBgvqX2j8Hmg9faBtEAC4-d-X8pCAhn4oWz_i-oR0QHp07G5enhrkFFInps8m7hvArrVGBv2YGONKjHpzjl_qVecFKxCsSEMjGiUjj9mtFfAmBQbhIm2ctk2QxXEP3DBOTU0SilJy6gi30FmSSXDGYO-MgzDrzZ3TgwlSpFO-vxqNXKs3hCkI" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="bg-white dark:bg-background-dark py-20" id="services">
                    <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
                        <div className="flex flex-col gap-4 mb-12">
                            <h2 className="text-primary text-sm font-bold uppercase tracking-widest">Expertise</h2>
                            <h1 className="text-[#111418] dark:text-white text-4xl font-extrabold tracking-tight">Our Services</h1>
                            <p className="text-[#617589] dark:text-gray-400 text-lg max-w-[720px]">
                                Streamlining every step of your vehicle acquisition journey with white-glove service.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {services.map((service, index) => (
                                <ServiceCard
                                    key={index}
                                    icon={service.icon}
                                    title={service.title}
                                    description={service.description}
                                />
                            ))}
                        </div>
                    </div>
                </section>
                
                <FeaturedListings />

                <section className="py-20 px-6">
                    <div className="max-w-[1100px] mx-auto bg-gradient-to-br from-[#128c7e] to-[#25d366] rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute -right-20 -top-20 opacity-10">
                            <span className="material-symbols-outlined text-[300px]">chat</span>
                        </div>
                        <div className="relative z-10 flex flex-col items-center gap-8">
                            <div className="flex flex-col gap-4">
                                <h2 className="text-3xl md:text-5xl font-black tracking-tight">Connect via WhatsApp</h2>
                                <p className="text-white/90 text-lg md:text-xl font-medium max-w-[640px] leading-relaxed">
                                    Real-time updates and expert advice at your fingertips. Chat with us for a personalized experience and instant car availability checks.
                                </p>
                            </div>
                            <a href="#contact" className="flex items-center gap-3 bg-white text-[#128c7e] hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-extrabold transition-all shadow-lg group">
                                <span className="material-symbols-outlined font-bold">chat</span>
                                Chat with an Expert
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </a>
                        </div>
                    </div>
                </section>
                
                <section className="py-20 bg-background-light dark:bg-background-dark/50" id="contact">
                    <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                            <div className="flex flex-col gap-10">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#111418] dark:text-white mb-6">Contact Details</h2>
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                                <span className="material-symbols-outlined">call_log</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#111418] dark:text-white">Call Us</p>
                                                <p className="text-[#617589] dark:text-gray-400">+1 (832)400-5373</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                                <span className="material-symbols-outlined">mail</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#111418] dark:text-white">Email Us</p>
                                                <p className="text-[#617589] dark:text-gray-400">ventas@gsautobrokers.com</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[#111418] dark:text-white mb-4">Compliance &amp; Privacy</h2>
                                    <div className="bg-white dark:bg-gray-900 border border-[#dbe0e6] dark:border-gray-800 p-6 rounded-2xl">
                                        <p className="text-sm text-[#617589] dark:text-gray-400 leading-relaxed mb-4">
                                            GS Autobrokers is committed to protecting your privacy and ensuring the security of your personal data. We comply with all relevant automotive brokerage regulations.
                                        </p>
                                        <p className="text-sm text-[#617589] dark:text-gray-400 leading-relaxed">
                                            Your information is used strictly for vehicle sourcing and financing purposes. We never sell your data to third parties. Our full privacy policy is available upon request.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-900 p-8 md:p-10 rounded-3xl shadow-sm border border-[#dbe0e6] dark:border-gray-800">
                                <h2 className="text-2xl font-bold text-[#111418] dark:text-white mb-8">Quick Inquiry</h2>
                                <QuickInquiryForm />
                            </div>
                        </div>
                    </div>
                </section>
                
                <section className="py-20 bg-gradient-to-br from-slate-800 to-slate-900 text-white" id="recruiting">
                    <div className="max-w-[1280px] mx-auto px-6 lg:px-10 text-center">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Conviértete en Autobroker</h2>
                        <p className="text-white/90 text-lg md:text-xl font-medium max-w-[720px] mx-auto leading-relaxed mb-10">
                            ¿Te apasionan los autos y tienes hambre de éxito? En GS Autobrokers, te ofrecemos la plataforma para que te conviertas en un broker independiente. Olvídate de los horarios fijos y los límites de sueldo. Nuestro modelo es 100% basado en comisiones: <strong>tus ganancias dependen directamente de tu rendimiento y tu capacidad para cerrar ventas.</strong> Nosotros te proporcionamos el inventario, las herramientas y el soporte; tú pones la ambición y el talento.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12 text-left">
                            <div className="flex items-start gap-4">
                                <div className="bg-white/10 p-3 rounded-xl text-primary"><span className="material-symbols-outlined">payments</span></div>
                                <div>
                                    <h3 className="font-bold">Gana sin límites</h3>
                                    <p className="text-sm text-white/80">Comisiones atractivas por cada vehículo vendido.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="bg-white/10 p-3 rounded-xl text-primary"><span className="material-symbols-outlined">event_seat</span></div>
                                <div>
                                    <h3 className="font-bold">Sé tu propio jefe</h3>
                                    <p className="text-sm text-white/80">Total flexibilidad para manejar tu tiempo y tus clientes.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="bg-white/10 p-3 rounded-xl text-primary"><span className="material-symbols-outlined">directions_car</span></div>
                                <div>
                                    <h3 className="font-bold">Acceso a inventario exclusivo</h3>
                                    <p className="text-sm text-white/80">Vende los mejores autos del mercado de Houston.</p>
                                </div>
                            </div>
                        </div>
                        <Link href="/apply" className="bg-white text-navy-brand hover:bg-gray-200 px-8 py-4 rounded-xl text-lg font-extrabold transition-all shadow-lg group flex items-center justify-center max-w-xs mx-auto">
                            Aplicar
                            <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </Link>
                    </div>
                </section>
            </main>
            <footer className="bg-white dark:bg-background-dark border-t border-[#f0f2f4] dark:border-gray-800 py-12">
                <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                        <Logo />
                        <div className="flex items-center gap-8">
                            <a className="text-gray-500 hover:text-primary transition-colors" href="/"><span className="material-symbols-outlined">public</span></a>
                            <button onClick={handleShare} className="text-gray-500 hover:text-primary transition-colors"><span className="material-symbols-outlined">share</span></button>
                            <a className="text-gray-500 hover:text-primary transition-colors" href="https://www.facebook.com/profile.php?id=61586974973358" target="_blank" rel="noopener noreferrer"><span className="material-symbols-outlined">thumb_up</span></a>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                        <p>© 2026 GS Autobrokers LLC. All rights reserved.</p>
                        <div className="flex gap-8">
                            <Link className="hover:underline" href="/privacy">Privacy Policy</Link>
                            <Link className="hover:underline" href="/terms">Terms of Service</Link>
                            <Link className="hover:underline" href="/cookie-policy">Cookie Policy</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
