import Link from 'next/link';

export default function InventoryPage() {
  const vehicles = [
    {
      name: '2023 Toyota Corolla',
      description: 'LE Sedan • Super White',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL8SsM9HsZRMmBRt4xFna466XyhJdskV4Q3auvkjP9JfGOx9pCM1t9TtVK4hLH8flL6UHle1TxMxf7cYgxahtjYMo67eANOxPnFljKzXv22d2grWkbkdAYvjSnxx0ZehK5GmkqD3t8qacw_YtR-8nUA0msUYb3xZLRrwRIv9oKbCYYq2XKfw9CWZ-TF_Jn9qd-HKEdC9q0rORE64qCH1iXkipBOYk2EOqLXbddS2faFzjIPVDHDweAhPVLZQQCShZGgNpT_muPwno',
      badge: 'New Arrival',
      badgeColor: 'bg-navy-brand/90',
      features: [{ icon: 'settings', label: 'Auto' }, { icon: 'ev_station', label: 'Gas' }],
      mileage: '12,450 mi',
      downpayment: '$2,500',
      price: '$24,500'
    },
    {
      name: '2021 Ford F-150',
      description: 'Lariat Crew Cab • Shadow Black',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnsos4Et9PodYxHBERhOIXXkcRGd1w2_d6tSTfuX554xO1mqwOpman9QRjSGqBVYgvYgG6ZLS6S3nSPJhKuYOTTprFX3qNl6sPe8uyHqf5DcV_rKBQIQXJoOR22IFBFC0SK31aeTsnCfQsEVNngddOYOZXxwQxym7EA3sxrel1tHl2d26QkZYTbnVbMv8gDc0pzKGPpdhdZ2QGREwnomF6DvjcubclMeI5Lz1OPi6f_rGMNr1rrKjcePfS3_QVkaLHO9h5ulSt2EI',
      badge: null,
      features: [{ icon: 'local_gas_station', label: 'V8' }, { icon: 'grid_4x4', label: '4WD' }],
      mileage: '34,120 mi',
      downpayment: '$4,500',
      price: '$42,000'
    },
    {
      name: '2023 Tesla Model 3',
      description: 'Long Range AWD • Pearl White',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyhdBySzZpp3GgaQXUFTGm-7Wa2jRNvL01PNGLBnqzV2xcSY-qgNmohxev5zzaSRAtND7KFzs7NjXXWg_rQqy1X1hP-xm3bvNPjzswvuv940uUj90QnDddeu093pDYKfvItl16reSVsW_le0lFAf7THHhABGZB1nVP-QceDFTG355y-xDN1b5lWlXnxNhJ-Gbn9h23f1Sobvqppon6omijfW1VGW3Wat1zbqCaVa0A9KUP6KAcfzKbNI19VozXrIYb5O9Z2TytPCY',
      badge: 'Electric',
      badgeColor: 'bg-blue-600/90',
      features: [{ icon: 'bolt', label: 'Electric' }],
      mileage: '8,200 mi',
      downpayment: '$4,000',
      price: '$39,990'
    },
    {
        name: '2022 Honda Civic',
        description: 'Sport Touring • Sonic Gray',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL8SsM9HsZRMmBRt4xFna466XyhJdskV4Q3auvkjP9JfGOx9pCM1t9TtVK4hLH8flL6UHle1TxMxf7cYgxahtjYMo67eANOxPnFljKzXv22d2grWkbkdAYvjSnxx0ZehK5GmkqD3t8qacw_YtR-8nUA0msUYb3xZLRrwRIv9oKbCYYq2XKfw9CWZ-TF_Jn9qd-HKEdC9q0rORE64qCH1iXkipBOYk2EOqLXbddS2faFzjIPVDHDweAhPVLZQQCShZGgNpT_muPwno',
        badge: null,
        features: [],
        mileage: '15,600 mi',
        downpayment: '$2,200',
        price: '$27,900'
    },
    {
        name: '2021 Toyota RAV4',
        description: 'XLE Premium • Lunar Rock',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnsos4Et9PodYxHBERhOIXXkcRGd1w2_d6tSTfuX554xO1mqwOpman9QRjSGqBVYgvYgG6ZLS6S3nSPJhKuYOTTprFX3qNl6sPe8uyHqf5DcV_rKBQIQXJoOR22IFBFC0SK31aeTsnCfQsEVNngddOYOZXxwQxym7EA3sxrel1tHl2d26QkZYTbnVbMv8gDc0pzKGPpdhdZ2QGREwnomF6DvjcubclMeI5Lz1OPi6f_rGMNr1rrKjcePfS3_QVkaLHO9h5ulSt2EI',
        badge: 'Certified',
        badgeColor: 'bg-primary/90',
        features: [],
        mileage: '28,900 mi',
        downpayment: '$3,500',
        price: '$31,500'
    }
  ];

  return (
    <div className="bg-white text-slate-900 font-display min-h-screen">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3">
                <div className="bg-navy-brand rounded-lg size-10 flex items-center justify-center text-white">
                    <span className="material-symbols-outlined">directions_car</span>
                </div>
                <span className="text-navy-brand text-xl font-extrabold tracking-tight">GS Autobrokers</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link className="text-sm font-bold text-slate-600 hover:text-navy-brand transition-colors" href="/">Home</Link>
              <Link className="text-sm font-bold text-navy-brand border-b-2 border-primary pb-1" href="/inventory">Inventory</Link>
              <a className="text-sm font-bold text-slate-600 hover:text-navy-brand transition-colors" href="#">Financing</a>
              <a className="text-sm font-bold text-slate-600 hover:text-navy-brand transition-colors" href="#">About Us</a>
              <a className="text-sm font-bold text-slate-600 hover:text-navy-brand transition-colors" href="#">Contact</a>
            </nav>
            <div className="flex items-center gap-4">
              <button className="hidden lg:flex items-center gap-2 text-navy-brand font-bold text-sm">
                <span className="material-symbols-outlined text-lg">call</span>
                (555) 123-4567
              </button>
              <button className="bg-navy-brand text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-800 transition-all">
                Get Pre-Approved
              </button>
            </div>
          </div>
        </div>
      </header>
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-3xl mb-8">
            <h1 className="text-3xl font-extrabold text-navy-brand mb-2">Our Exclusive Inventory</h1>
            <p className="text-slate-500 text-base">Premium vehicles with guaranteed quality and transparent pricing.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-1 relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Search</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                  <input className="w-full pl-9 pr-4 py-2 bg-slate-50 border-slate-200 rounded-lg focus:ring-primary focus:border-primary text-sm" placeholder="Model, keyword..." type="text" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Make</label>
                <select className="w-full bg-slate-50 border-slate-200 rounded-lg py-2 text-sm focus:ring-primary focus:border-primary">
                  <option>All Makes</option>
                  <option>Toyota</option>
                  <option>Ford</option>
                  <option>Tesla</option>
                  <option>Honda</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Body Style</label>
                <select className="w-full bg-slate-50 border-slate-200 rounded-lg py-2 text-sm focus:ring-primary focus:border-primary">
                  <option>All Styles</option>
                  <option>Sedan</option>
                  <option>SUV</option>
                  <option>Truck</option>
                  <option>Coupe</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Max Price</label>
                <select className="w-full bg-slate-50 border-slate-200 rounded-lg py-2 text-sm focus:ring-primary focus:border-primary">
                  <option>Any Price</option>
                  <option>Under $20k</option>
                  <option>Under $30k</option>
                  <option>Under $50k</option>
                  <option>$50k+</option>
                </select>
              </div>
              <div className="flex items-end">
                <button className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-sm">tune</span>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-500 font-medium text-sm">Showing <span className="text-navy-brand font-bold">24</span> vehicles found</p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Sort by:</span>
            <select className="border-none bg-transparent text-xs font-bold text-navy-brand focus:ring-0 cursor-pointer p-0">
              <option>Newest Listings</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Mileage: Low to High</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {vehicles.map((vehicle, index) => (
            <div key={index} className="group card-hover bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url("${vehicle.image}")` }}></div>
                {vehicle.badge && (
                  <div className="absolute top-3 left-3">
                    <span className={`${vehicle.badgeColor} backdrop-blur text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider`}>{vehicle.badge}</span>
                  </div>
                )}
                {vehicle.features.length > 0 && (
                  <div className="absolute bottom-3 left-3 right-3 flex gap-1.5 opacity-0 translate-y-1 transition-all duration-300 feature-badge">
                    {vehicle.features.map((feature, idx) => (
                      <div key={idx} className="bg-white/95 backdrop-blur px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200">
                        <span className="material-symbols-outlined text-[10px]">{feature.icon}</span>
                        <span className="text-[9px] font-bold">{feature.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-base font-extrabold text-navy-brand truncate">{vehicle.name}</h3>
                <p className="text-slate-500 text-[11px] font-medium mb-3 truncate">{vehicle.description}</p>
                <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 mb-3">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Mileage</p>
                    <p className="font-bold text-slate-700 text-xs truncate">{vehicle.mileage}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Downpayment</p>
                    <p className="font-bold text-slate-700 text-xs truncate">{vehicle.downpayment}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Cash Price</p>
                    <p className="text-lg font-black text-navy-brand leading-none">{vehicle.price}</p>
                  </div>
                  <button className="bg-whatsapp/10 text-whatsapp size-9 rounded-lg flex items-center justify-center hover:bg-whatsapp hover:text-white transition-all">
                    <svg className="size-5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.187-2.59-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.747-2.874-2.512-2.96-2.626-.088-.113-.716-.953-.716-1.819 0-.866.454-1.292.614-1.456.162-.162.355-.205.474-.205.118 0 .237 0 .341.005.107.005.25-.04.392.302.144.35.496 1.208.539 1.294.043.085.071.185.014.298-.057.114-.085.185-.171.285-.085.103-.181.229-.258.307-.087.085-.177.177-.076.35.101.171.448.74 0.962 1.201.662.595 1.22.78 1.391.866.171.085.271.071.371-.043.1-.113.426-.498.539-.669.114-.171.228-.142.384-.085.157.057.994.469 1.166.554.171.085.284.128.326.2.043.071.043.413-.101.818zM12 2a10 10 0 0 0-10 10c0 1.956.558 3.778 1.526 5.32L2 22l4.81-1.258A9.97 9.97 0 0 0 12 22a10 10 0 0 0 10-10A10 10 0 0 0 12 2z"></path></svg>
                  </button>
                </div>
                <button className="w-full bg-slate-100 hover:bg-navy-brand hover:text-white text-navy-brand font-bold py-2 rounded-lg text-xs transition-all mt-auto">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-[1px] w-20 bg-slate-200"></div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Showing {vehicles.length} of 156 Vehicles</p>
            <div className="h-[1px] w-20 bg-slate-200"></div>
          </div>
          <button className="group flex flex-col items-center gap-3">
            <div className="size-12 rounded-full border-2 border-slate-100 flex items-center justify-center text-navy-brand group-hover:bg-navy-brand group-hover:text-white group-hover:border-navy-brand transition-all duration-300">
              <span className="material-symbols-outlined animate-bounce">expand_more</span>
            </div>
            <span className="text-sm font-extrabold text-navy-brand">Load More Vehicles</span>
          </button>
        </div>
      </main>
      <footer className="bg-navy-brand text-white py-12 mt-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg size-10 flex items-center justify-center text-navy-brand">
                <span className="material-symbols-outlined">directions_car</span>
              </div>
              <span className="text-xl font-extrabold tracking-tight">GS Autobrokers</span>
            </div>
            <div className="flex gap-8 text-sm font-bold text-slate-400">
              <a className="hover:text-white transition-colors" href="#">Privacy Policy</a>
              <a className="hover:text-white transition-colors" href="#">Terms of Service</a>
              <a className="hover:text-white transition-colors" href="#">Sitemap</a>
            </div>
            <p className="text-sm text-slate-500">© 2024 GS Autobrokers. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
