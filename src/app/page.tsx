import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="bg-background-light dark:bg-background-dark text-[#111418] dark:text-white antialiased">
            <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-[#f0f2f4] dark:border-gray-800">
                <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-primary flex items-center">
                            <span className="material-symbols-outlined text-3xl">directions_car</span>
                        </div>
                        <h2 className="text-[#111418] dark:text-white text-xl font-extrabold tracking-tight">GS Autobrokers</h2>
                    </div>
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
                            <div className="flex items-center gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex -space-x-2">
                                    <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                        <img className="w-full h-full object-cover" alt="client portrait" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqeJPlc2EVr5REm4n2uagXzUXOmOnccu0n-lwTmb2rv8QehwDAXq_mqCsWcC6iAVQxC-j-QdlVIKFxBFsY2op1c29J56oyhSeOQ8-YYhGE_w-2RuJUan40OKExvQP1JupAI8jF9-hGfTUk1BbrwvkJuFrPOtQpZbCUgF04r-OADqK6UwdJ8qZT7vH2NWdG-yAaomYLTGFI4fOM_-AOHAG0XAzqiLcAn5DGjA1ZpV_JQDoxlUaQmMRoUVjcHWugFEtejFRm2YDrj7U" />
                                    </div>
                                    <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                        <img className="w-full h-full object-cover" alt="client portrait" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwlOf5moe1tn3zHpcevOxX4bo_UJt716RTLRmCReh2sbLP63jDGhZ2Fh-0CheFxkmmiExG05nnwHQlF63x-VtpLLjBMz4cjPzTb8UiM7IKjHDYeg7fbYMbFzyIv1yL6ah3eIC1_0vJKFIXDiAPuZo9skyqwVDhKtO-DpU-nmYE3yVHTbZuFT4kh5sTCf6wZqL0RoTKxk2zxvcnyUlCb5qFeRMjR3j89lRN3SK3cVt5fD6rmpeabuCfpavI7yQd68FSjoO8DiXdd-o" />
                                    </div>
                                    <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                        <img className="w-full h-full object-cover" alt="client portrait" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMhOWQ9aDnOI2McB4Uo2DJLwEKp0OZ4ayRflXGKlzc2A0LZNpEMw-6ziHs4EahngpsGdPVZgjTAnGPAb9oEyMSGyl10hhWg5LKknuIkvxva7lfjWrn5F-gKHDHI9wodeHgDLqQrTlzf5iQpJ9JmzcfIFcKy4ZYH9_ohYrdZaqri7CTOC-Xn3S7aWwcMIXBvKa5nW9g5i2uhrAXvsqBr0M5Y0rIjDq0EpkElhMe5cA2XTgiv4ovC2lrbmqtoW_9fLMTD5CVqCda9Gw" />
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-gray-500"><span className="text-primary font-bold">500+</span> pre-owned vehicles sourced last year</p>
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
                            <div className="group flex flex-col gap-5 rounded-2xl border border-[#dbe0e6] dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 hover:shadow-xl hover:border-primary/30 transition-all">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-3xl">search</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight">Vehicle Sourcing</h2>
                                    <p className="text-[#617589] dark:text-gray-400 text-base font-normal leading-relaxed">
                                        Access to the Houston, Texas network market to find your specific make, model, and trim level, including rare editions.
                                    </p>
                                </div>
                            </div>
                            <div className="group flex flex-col gap-5 rounded-2xl border border-[#dbe0e6] dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 hover:shadow-xl hover:border-primary/30 transition-all">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-3xl">payments</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight">Financing Assistance</h2>
                                    <p className="text-[#617589] dark:text-gray-400 text-base font-normal leading-relaxed">
                                        Competitive rates and simplified paperwork handled by experts to ensure a seamless transaction.
                                    </p>
                                </div>
                            </div>
                            <div className="group flex flex-col gap-5 rounded-2xl border border-[#dbe0e6] dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 hover:shadow-xl hover:border-primary/30 transition-all">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-3xl">thumb_up</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight">Great Customer Service</h2>
                                    <p className="text-[#617589] dark:text-gray-400 text-base font-normal leading-relaxed">
                                    Our team assists with vehicle availability, pricing, financing options, and appointment scheduling.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
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
                            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-[#dbe0e6] dark:border-gray-700 shadow-sm hover:shadow-xl transition-all group">
                                <div className="relative h-64 overflow-hidden">
                                    <img alt="2024 Performance Sedan" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAW8qwR1QFDlNtFay3FowX4CLtETin5kobnN8-sjj8jAvUlvVXgRnP87eUjXxpyOzsrxuht8hjlBeC9Tc0L5x2RxbbBgvqX2j8Hmg9faBtEAC4-d-X8pCAhn4oWz_i-oR0QHp07G5enhrkFFInps8m7hvArrVGBv2YGONKjHpzjl_qVecFKxCsSEMjGiUjj9mtFfAmBQbhIm2ctk2QxXEP3DBOTU0SilJy6gi30FmSSXDGYO-MgzDrzZ3TgwlSpFO-vxqNXKs3hCkI" />
                                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 px-3 py-1 rounded-full text-xs font-bold text-primary">Featured</div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-extrabold text-[#111418] dark:text-white mb-4">2024 BMW X5 M Competition</h3>
                                    <div className="grid grid-cols-3 gap-2 mb-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Mileage</span>
                                            <div className="flex items-center gap-1 text-sm font-semibold text-[#111418] dark:text-gray-200">
                                                <span className="material-symbols-outlined text-xs text-primary">speed</span>
                                                1,200 mi
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 border-x border-gray-100 dark:border-gray-700 px-2">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Fuel</span>
                                            <div className="flex items-center gap-1 text-sm font-semibold text-[#111418] dark:text-gray-200">
                                                <span className="material-symbols-outlined text-xs text-primary">local_gas_station</span>
                                                Gasoline
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 text-right">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Trans</span>
                                            <div className="flex items-center justify-end gap-1 text-sm font-semibold text-[#111418] dark:text-gray-200">
                                                <span className="material-symbols-outlined text-xs text-primary">settings_input_component</span>
                                                Auto
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full bg-primary/5 hover:bg-primary hover:text-white text-primary font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                                        View Details
                                    </button>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-[#dbe0e6] dark:border-gray-700 shadow-sm hover:shadow-xl transition-all group">
                                <div className="relative h-64 overflow-hidden">
                                    <img alt="Luxury SUV" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMhOWQ9aDnOI2McB4Uo2DJLwEKp0OZ4ayRflXGKlzc2A0LZNpEMw-6ziHs4EahngpsGdPVZgjTAnGPAb9oEyMSGyl10hhWg5LKknuIkvxva7lfjWrn5F-gKHDHI9wodeHgDLqQrTlzf5iQpJ9JmzcfIFcKy4ZYH9_ohYrdZaqri7CTOC-Xn3S7aWwcMIXBvKa5nW9g5i2uhrAXvsqBr0M5Y0rIjDq0EpkElhMe5cA2XTgiv4ovC2lrbmqtoW_9fLMTD5CVqCda9Gw" />
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-extrabold text-[#111418] dark:text-white mb-4">2023 Porsche Taycan 4S</h3>
                                    <div className="grid grid-cols-3 gap-2 mb-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Mileage</span>
                                            <div className="flex items-center gap-1 text-sm font-semibold text-[#111418] dark:text-gray-200">
                                                <span className="material-symbols-outlined text-xs text-primary">speed</span>
                                                5,450 mi
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 border-x border-gray-100 dark:border-gray-700 px-2">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Fuel</span>
                                            <div className="flex items-center gap-1 text-sm font-semibold text-[#111418] dark:text-gray-200">
                                                <span className="material-symbols-outlined text-xs text-primary">bolt</span>
                                                Electric
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 text-right">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Trans</span>
                                            <div className="flex items-center justify-end gap-1 text-sm font-semibold text-[#111418] dark:text-gray-200">
                                                <span className="material-symbols-outlined text-xs text-primary">settings_input_component</span>
                                                Auto
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full bg-primary/5 hover:bg-primary hover:text-white text-primary font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                                        View Details
                                    </button>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-[#dbe0e6] dark:border-gray-700 shadow-sm hover:shadow-xl transition-all group">
                                <div className="relative h-64 overflow-hidden">
                                    <img alt="Sports Coupe" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwlOf5moe1tn3zHpcevOxX4bo_UJt716RTLRmCReh2sbLP63jDGhZ2Fh-0CheFxkmmiExG05nnwHQlF63x-VtpLLjBMz4cjPzTb8UiM7IKjHDYeg7fbYMbFzyIv1yL6ah3eIC1_0vJKFIXDiAPuZo9skyqwVDhKtO-DpU-nmYE3yVHTbZuFT4kh5sTCf6wZqL0RoTKxk2zxvcnyUlCb5qFeRMjR3j89lRN3SK3cVt5fD6rmpeabuCfpavI7yQd68FSjoO8DiXdd-o" />
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-extrabold text-[#111418] dark:text-white mb-4">2024 Audi RS e-tron GT</h3>
                                    <div className="grid grid-cols-3 gap-2 mb-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Mileage</span>
                                            <div className="flex items-center gap-1 text-sm font-semibold text-[#111418] dark:text-gray-200">
                                                <span className="material-symbols-outlined text-xs text-primary">speed</span>
                                                420 mi
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 border-x border-gray-100 dark:border-gray-700 px-2">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Fuel</span>
                                            <div className="flex items-center gap-1 text-sm font-semibold text-[#111418] dark:text-gray-200">
                                                <span className="material-symbols-outlined text-xs text-primary">bolt</span>
                                                Electric
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 text-right">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Trans</span>
                                            <div className="flex items-center justify-end gap-1 text-sm font-semibold text-[#111418] dark:text-gray-200">
                                                <span className="material-symbols-outlined text-xs text-primary">settings_input_component</span>
                                                Auto
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full bg-primary/5 hover:bg-primary hover:text-white text-primary font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
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
                                <form className="flex flex-col gap-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Name</label>
                                            <input className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="John Doe" type="text" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Phone</label>
                                            <input className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="+1 (555) 000-0000" type="tel" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Interested In</label>
                                        <select className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none text-sm">
                                            <option>Vehicle Sourcing</option>
                                            <option>Financing Assistance</option>
                                            <option>General Inquiry</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Message</label>
                                        <textarea className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none text-sm resize-none" placeholder="Tell us about the vehicle you're looking for..." rows={4}></textarea>
                                    </div>
                                    <button className="bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all mt-4">
                                        Send Message
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="bg-white dark:bg-background-dark border-t border-[#f0f2f4] dark:border-gray-800 py-12">
                <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                        <div className="flex items-center gap-3">
                            <div className="text-primary flex items-center">
                                <span className="material-symbols-outlined text-3xl">directions_car</span>
                            </div>
                            <h2 className="text-[#111418] dark:text-white text-xl font-extrabold tracking-tight">GS Autobrokers</h2>
                        </div>
                        <div className="flex items-center gap-8">
                            <a className="text-gray-500 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">public</span></a>
                            <a className="text-gray-500 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">share</span></a>
                            <a className="text-gray-500 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">thumb_up</span></a>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                        <p>© 2024 GS Autobrokers. All rights reserved.</p>
                        <div className="flex gap-8">
                            <a className="hover:underline" href="#">Privacy Policy</a>
                            <a className="hover:underline" href="#">Terms of Service</a>
                            <a className="hover:underline" href="#">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
