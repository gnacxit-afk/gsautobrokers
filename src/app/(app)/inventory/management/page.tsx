
'use client';

import {
  Car,
  CheckCircle,
  PlusCircle,
  Search,
  Filter,
  Download,
  Edit,
  MoreVertical,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const vehicles = [{
  name: '2023 Toyota Corolla',
  description: 'LE Sedan • White Exterior',
  vin: '5YFEPMAE...3821',
  stock: '#GS-2938',
  status: 'Active',
  price: '$24,500',
  msrp: 'MSRP $25,120',
  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL8SsM9HsZRMmBRt4xFna466XyhJdskV4Q3auvkjP9JfGOx9pCM1t9TtVK4hLH8flL6UHle1TxMxf7cYgxahtjYMo67eANOxPnFljKzXv22d2grWkbkdAYvjSnxx0ZehK5GmkqD3t8qacw_YtR-8nUA0msUYb3xZLRrwRIv9oKbCYYq2XKfw9CWZ-TF_Jn9qd-HKEdC9q0rORE64qCH1iXkipBOYk2EOqLXbddS2faFzjIPVDHDweAhPVLZQQCShZGgNpT_muPwno',
  statusColor: 'bg-[#e3f2fd] text-primary',
  statusDotColor: 'bg-primary'
}, {
  name: '2021 Ford F-150',
  description: 'Lariat Crew Cab • Black',
  vin: '1FTEW1CP...9912',
  stock: '#GS-1102',
  status: 'Sold',
  price: '$42,000',
  msrp: 'Margin: 12%',
  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnsos4Et9PodYxHBERhOIXXkcRGd1w2_d6tSTfuX554xO1mqwOpman9QRjSGqBVYgvYgG6ZLS6S3nSPJhKuYOTTprFX3qNl6sPe8uyHqf5DcV_rKBQIQXJoOR22IFBFC0SK31aeTsnCfQsEVNngddOYOZXxwQxym7EA3sxrel1tHl2d26QkZYTbnVbMv8gDc0pzKGPpdhdZ2QGREwnomF6DvjcubclMeI5Lz1OPi6f_rGMNr1rrKjcePfS3_QVkaLHO9h5ulSt2EI',
  statusColor: 'bg-[#f1f3f5] text-slate-600',
  statusDotColor: 'bg-slate-400'
}, {
  name: '2023 Tesla Model 3',
  description: 'Long Range AWD • Pearl White',
  vin: '5YJ3E1EB...0019',
  stock: '#GS-EV01',
  status: 'Pending',
  price: '$39,990',
  msrp: 'Pending Offer',
  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyhdBySzZpp3GgaQXUFTGm-7Wa2jRNvL01PNGLBnqzV2xcSY-qgNmohxev5zzaSRAtND7KFzs7NjXXWg_rQqy1X1hP-xm3bvNPjzswvuv940uUj90QnDddeu093pDYKfvItl16reSVsW_le0lFAf7THHhABGZB1nVP-QceDFTG355y-xDN1b5lWlXnxNhJ-Gbn9h23f1Sobvqppon6omijfW1VGW3Wat1zbqCaVa0A9KUP6KAcfzKbNI19VozXrIYb5O9Z2TytPCY',
  statusColor: 'bg-[#fff8e1] text-amber-700',
  statusDotColor: 'bg-amber-500'
}, {
  name: '2022 Honda Civic',
  description: 'Sport Hatchback • Sonic Gray',
  vin: '1HGCF2F8...7429',
  stock: '#GS-4421',
  status: 'Active',
  price: '$22,800',
  msrp: 'MSRP $23,900',
  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDI5GiC31cyataPtWsxGztifauxoXnBM0Elg9VQF_bbmrbp1gMUJGLSb7bp2zCnVJM7iVI2mXVeJvwtglGXic7zWmS9gfwRcHt20tLpN0oGvgaR60J04r9vYWoHg6Zmmed3_HqSeTjQ4wWOjyZdSUYp05a05_XbPVEODZO_0LvazSyfPuAWy7_skeUJAniUrd6vUJEzuyBvGHCj2uB83cJs90Kkx6_g6s2OgvsZmIJMxEIyhpkhu2RncEm2do6YwVXYng_1defEH-o',
  statusColor: 'bg-[#e3f2fd] text-primary',
  statusDotColor: 'bg-primary'
}, ];

export default function InventoryManagementPage() {
  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
            <div className="size-14 rounded-full bg-[#f0f7ff] dark:bg-blue-900/30 flex items-center justify-center text-primary">
              <Car className="text-2xl" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Vehicles</p>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">124</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
            <div className="size-14 rounded-full bg-[#f0fff4] dark:bg-green-900/30 flex items-center justify-center text-green-500">
              <CheckCircle className="text-2xl" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Active Listings</p>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">86</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
            <div className="size-14 rounded-full bg-[#fff9eb] dark:bg-amber-900/30 flex items-center justify-center text-amber-500">
              <DollarSign className="text-2xl" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Sold this Month</p>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">12</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-8 py-6 flex items-center justify-between">
            <div className="flex gap-4">
              <button className="px-6 py-2 text-sm font-bold bg-white dark:bg-slate-700 text-primary shadow-sm rounded-full border border-slate-100 dark:border-slate-600">All Inventory</button>
              <button className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-full transition-colors">Active</button>
              <button className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-full transition-colors">Pending</button>
              <button className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-full transition-colors">Sold</button>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full hover:bg-slate-50 transition-colors">
                <Filter className="text-lg" />
                <span>Filter</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full hover:bg-slate-50 transition-colors">
                <Download className="text-lg" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-50">
                  <th className="px-8 py-4">Vehicle</th>
                  <th className="px-8 py-4">VIN / Stock #</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Price</th>
                  <th className="px-8 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {vehicles.map((vehicle, index) => (
                  <tr key={index} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="size-16 rounded-2xl bg-cover bg-center border border-slate-100 dark:border-slate-700 shrink-0 shadow-sm" style={{ backgroundImage: `url("${vehicle.image}")` }}></div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{vehicle.name}</p>
                          <p className="text-[11px] text-slate-500">{vehicle.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[10px] font-medium text-slate-400 uppercase">
                        <p>VIN: <span className="font-mono text-slate-600 dark:text-slate-300">{vehicle.vin}</span></p>
                        <p>STK: <span className="font-mono text-slate-600 dark:text-slate-300">{vehicle.stock}</span></p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${vehicle.statusColor}`}>
                        <span className={`size-1 rounded-full ${vehicle.statusDotColor} mr-2`}></span>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{vehicle.price}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-medium">{vehicle.msrp}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                          <Edit className="text-xl" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600">
                          <MoreVertical className="text-xl" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider uppercase">Showing 1-10 of 124 vehicles</p>
            <div className="flex items-center gap-1">
              <button className="p-1 text-slate-400 hover:text-slate-600">
                <ChevronLeft className="text-lg" />
              </button>
              <button className="size-8 rounded-lg bg-primary text-white text-xs font-bold shadow-sm">1</button>
              <button className="size-8 rounded-lg text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50">2</button>
              <button className="size-8 rounded-lg text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50">3</button>
              <span className="px-2 text-slate-300 text-xs">...</span>
              <button className="size-8 rounded-lg text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50">13</button>
              <button className="p-1 text-slate-400 hover:text-slate-600">
                <ChevronRight className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
