
'use client';

import { Car, CloudUpload, ImagePlus, CheckCircle, Send } from 'lucide-react';
import Link from 'next/link';

export default function AddCarPage() {
    return (
        <div className="flex flex-col gap-8 pb-32">
            <div className="flex flex-wrap gap-2 py-2">
                <Link className="text-[#617589] dark:text-gray-400 text-sm font-medium hover:text-primary" href="/inventory/management">Inventory</Link>
                <span className="text-[#617589] dark:text-gray-400 text-sm font-medium">/</span>
                <span className="text-[#111418] dark:text-white text-sm font-semibold">Add New Vehicle</span>
            </div>
            <div className="flex flex-wrap justify-between gap-3">
                <div className="flex min-w-72 flex-col gap-1">
                    <h1 className="text-[#111418] dark:text-white text-4xl font-extrabold leading-tight tracking-[-0.033em]">Add New Vehicle</h1>
                    <p className="text-[#617589] dark:text-gray-400 text-sm font-normal leading-normal">Fill in the details below to add a new vehicle to your digital showroom.</p>
                </div>
            </div>
            
            <div className="rounded-2xl border border-[#eceef1] dark:border-gray-800 bg-white dark:bg-background-dark p-8 shadow-sm">
                <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight tracking-tight pb-8">Basic Info</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <label className="flex flex-col">
                        <p className="text-[#111418] dark:text-white text-[13px] font-semibold pb-2">Year</p>
                        <input className="form-input rounded-xl border-[#dbe0e6] dark:border-gray-700 dark:bg-gray-900 focus:border-primary focus:ring-1 focus:ring-primary h-12 p-4 text-[#111418] placeholder:text-[#9ea7af]" placeholder="e.g. 2024" />
                    </label>
                    <label className="flex flex-col">
                        <p className="text-[#111418] dark:text-white text-[13px] font-semibold pb-2">Make</p>
                        <input className="form-input rounded-xl border-[#dbe0e6] dark:border-gray-700 dark:bg-gray-900 focus:border-primary focus:ring-1 focus:ring-primary h-12 p-4 text-[#111418] placeholder:text-[#9ea7af]" placeholder="e.g. Toyota" />
                    </label>
                    <label className="flex flex-col">
                        <p className="text-[#111418] dark:text-white text-[13px] font-semibold pb-2">Model</p>
                        <input className="form-input rounded-xl border-[#dbe0e6] dark:border-gray-700 dark:bg-gray-900 focus:border-primary focus:ring-1 focus:ring-primary h-12 p-4 text-[#111418] placeholder:text-[#9ea7af]" placeholder="e.g. Camry" />
                    </label>
                    <label className="flex flex-col">
                        <p className="text-[#111418] dark:text-white text-[13px] font-semibold pb-2">Trim</p>
                        <input className="form-input rounded-xl border-[#dbe0e6] dark:border-gray-700 dark:bg-gray-900 focus:border-primary focus:ring-1 focus:ring-primary h-12 p-4 text-[#111418] placeholder:text-[#9ea7af]" placeholder="e.g. XLE Premium" />
                    </label>
                </div>
            </div>
            <div className="rounded-2xl border border-[#eceef1] dark:border-gray-800 bg-white dark:bg-background-dark p-8 shadow-sm">
                <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight tracking-tight pb-8">Pricing</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <label className="flex flex-col">
                        <p className="text-[#111418] dark:text-white text-[13px] font-semibold pb-2">Cash Price ($)</p>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ea7af]">$</span>
                            <input className="form-input w-full rounded-xl border-[#dbe0e6] dark:border-gray-700 dark:bg-gray-900 focus:border-primary focus:ring-1 focus:ring-primary h-12 pl-8 pr-4 text-[#111418] placeholder:text-[#9ea7af]" placeholder="0.00" />
                        </div>
                    </label>
                    <label className="flex flex-col">
                        <p className="text-[#111418] dark:text-white text-[13px] font-semibold pb-2">Downpayment ($)</p>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ea7af]">$</span>
                            <input className="form-input w-full rounded-xl border-[#dbe0e6] dark:border-gray-700 dark:bg-gray-900 focus:border-primary focus:ring-1 focus:ring-primary h-12 pl-8 pr-4 text-[#111418] placeholder:text-[#9ea7af]" placeholder="0.00" />
                        </div>
                    </label>
                </div>
            </div>
            <div className="rounded-2xl border border-[#eceef1] dark:border-gray-800 bg-white dark:bg-background-dark p-8 shadow-sm">
                <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight tracking-tight pb-8">Features & Stats</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                    <label className="flex flex-col">
                        <p className="text-[#111418] dark:text-white text-[13px] font-semibold pb-2">Condition</p>
                        <select className="form-select rounded-xl border-[#dbe0e6] dark:border-gray-700 dark:bg-gray-900 focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-[#111418]">
                            <option>New</option>
                            <option>Used</option>
                            <option>Rebuilt</option>
                        </select>
                    </label>
                    <label className="flex flex-col">
                        <p className="text-[#111418] dark:text-white text-[13px] font-semibold pb-2">Mileage</p>
                        <input className="form-input rounded-xl border-[#dbe0e6] dark:border-gray-700 dark:bg-gray-900 focus:border-primary focus:ring-1 focus:ring-primary h-12 p-4 text-[#111418] placeholder:text-[#9ea7af]" placeholder="e.g. 45,000" />
                    </label>
                    <label className="flex flex-col">
                        <p className="text-[#111418] dark:text-white text-[13px] font-semibold pb-2">Transmission</p>
                        <select className="form-select rounded-xl border-[#dbe0e6] dark:border-gray-700 dark:bg-gray-900 focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-[#111418]">
                            <option>Automatic</option>
                            <option>Manual</option>
                            <option>CVT</option>
                        </select>
                    </label>
                    <label className="flex flex-col">
                        <p className="text-[#111418] dark:text-white text-[13px] font-semibold pb-2">Drive Train</p>
                        <input className="form-input rounded-xl border-[#dbe0e6] dark:border-gray-700 dark:bg-gray-900 focus:border-primary focus:ring-1 focus:ring-primary h-12 p-4 text-[#111418] placeholder:text-[#9ea7af]" placeholder="e.g. AWD" />
                    </label>
                    <label className="flex flex-col">
                        <p className="text-[#111418] dark:text-white text-[13px] font-semibold pb-2">Exterior Color</p>
                        <input className="form-input rounded-xl border-[#dbe0e6] dark:border-gray-700 dark:bg-gray-900 focus:border-primary focus:ring-1 focus:ring-primary h-12 p-4 text-[#111418] placeholder:text-[#9ea7af]" placeholder="e.g. Midnight Blue" />
                    </label>
                    <label className="flex flex-col">
                        <p className="text-[#111418] dark:text-white text-[13px] font-semibold pb-2">Interior Color</p>
                        <input className="form-input rounded-xl border-[#dbe0e6] dark:border-gray-700 dark:bg-gray-900 focus:border-primary focus:ring-1 focus:ring-primary h-12 p-4 text-[#111418] placeholder:text-[#9ea7af]" placeholder="e.g. Gray Leather" />
                    </label>
                    <label className="flex flex-col md:col-span-3">
                        <p className="text-[#111418] dark:text-white text-[13px] font-semibold pb-2">Fuel Type</p>
                        <div className="flex flex-wrap gap-2">
                            <label className="flex items-center gap-2 cursor-pointer bg-[#f0f2f4] dark:bg-gray-800 px-4 py-2 rounded-xl border border-transparent hover:border-primary/50 transition-all text-sm font-medium">
                                <input defaultChecked className="text-primary focus:ring-primary" name="fuel" type="radio"/>
                                <span>Gasoline</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer bg-[#f0f2f4] dark:bg-gray-800 px-4 py-2 rounded-xl border border-transparent hover:border-primary/50 transition-all text-sm font-medium">
                                <input className="text-primary focus:ring-primary" name="fuel" type="radio"/>
                                <span>Diesel</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer bg-[#f0f2f4] dark:bg-gray-800 px-4 py-2 rounded-xl border border-transparent hover:border-primary/50 transition-all text-sm font-medium">
                                <input className="text-primary focus:ring-primary" name="fuel" type="radio"/>
                                <span>Electric</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer bg-[#f0f2f4] dark:bg-gray-800 px-4 py-2 rounded-xl border border-transparent hover:border-primary/50 transition-all text-sm font-medium">
                                <input className="text-primary focus:ring-primary" name="fuel" type="radio"/>
                                <span>Hybrid</span>
                            </label>
                        </div>
                    </label>
                </div>
            </div>
            <div className="rounded-2xl border border-[#eceef1] dark:border-gray-800 bg-white dark:bg-background-dark p-8 shadow-sm">
                <div className="flex items-center justify-between pb-8">
                    <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight tracking-tight">Vehicle Photos</h2>
                    <p className="text-[12px] text-[#617589]">Minimum 5 photos recommended</p>
                </div>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#dbe0e6] dark:border-gray-700 rounded-xl p-16 bg-[#f8f9fb] dark:bg-gray-900 hover:bg-primary/5 transition-colors cursor-pointer group">
                    <CloudUpload className="text-4xl text-[#9ea7af] group-hover:text-primary mb-4 transition-colors" />
                    <p className="text-base font-bold text-[#111418] dark:text-white">Drag & drop photos here</p>
                    <p className="text-sm text-[#617589] mt-1">or click to browse from computer</p>
                    <p className="text-[11px] text-[#9ea7af] mt-6 uppercase tracking-wider font-semibold">Supports JPG, PNG up to 10MB each</p>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-8">
                    <div className="aspect-[1.5/1] bg-[#f0f2f4] dark:bg-gray-800 rounded-xl border border-dashed border-[#dbe0e6] dark:border-gray-600 flex items-center justify-center text-[#9ea7af] hover:text-primary transition-colors cursor-pointer">
                        <ImagePlus className="text-2xl" />
                    </div>
                    <div className="aspect-[1.5/1] bg-[#f0f2f4] dark:bg-gray-800 rounded-xl border border-dashed border-[#dbe0e6] dark:border-gray-600 flex items-center justify-center text-[#9ea7af] hover:text-primary transition-colors cursor-pointer">
                        <ImagePlus className="text-2xl" />
                    </div>
                    <div className="aspect-[1.5/1] bg-[#f0f2f4] dark:bg-gray-800 rounded-xl border border-dashed border-[#dbe0e6] dark:border-gray-600 flex items-center justify-center text-[#9ea7af] hover:text-primary transition-colors cursor-pointer">
                        <ImagePlus className="text-2xl" />
                    </div>
                    <div className="aspect-[1.5/1] bg-[#f0f2f4] dark:bg-gray-800 rounded-xl border border-dashed border-[#dbe0e6] dark:border-gray-600 flex items-center justify-center text-[#9ea7af] hover:text-primary transition-colors cursor-pointer">
                        <ImagePlus className="text-2xl" />
                    </div>
                </div>
            </div>
            
            <div className="w-full flex justify-center py-4 px-10">
                <div className="max-w-[960px] w-full flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#617589] text-[13px] font-medium">
                        <CheckCircle className="text-green-500 text-lg" />
                        All changes automatically saved as draft
                    </div>
                    <div className="flex gap-3">
                        <button className="px-6 h-11 rounded-full bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-white text-sm font-bold hover:bg-[#e5e7e9] dark:hover:bg-gray-700 transition-colors">
                            Save as Draft
                        </button>
                        <button className="px-8 h-11 rounded-full bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-all shadow-md shadow-primary/20 flex items-center gap-2">
                            <span>Publish to Inventory</span>
                            <Send className="text-lg" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

    