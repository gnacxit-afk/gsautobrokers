import type { Lead, Staff, Article } from './types';
import { PlaceHolderImages } from './placeholder-images';

const staff: Staff[] = [
  { id: '1', name: 'Ava Johnson', email: 'ava.j@gsautobrokers.com', role: 'Admin', hireDate: '2020-01-15', avatarUrl: PlaceHolderImages.find(img => img.id === 'user-1')?.imageUrl || '', dui: '11111111-1' },
  { id: '2', name: 'Liam Smith', email: 'liam.s@gsautobrokers.com', role: 'Supervisor', hireDate: '2021-03-22', avatarUrl: PlaceHolderImages.find(img => img.id === 'user-2')?.imageUrl || '', dui: '22222222-2' },
  { id: '3', name: 'Olivia Brown', email: 'olivia.b@gsautobrokers.com', role: 'Broker', hireDate: '2022-05-30', avatarUrl: PlaceHolderImages.find(img => img.id === 'user-3')?.imageUrl || '', dui: '33333333-3', supervisorId: '2' },
  { id: '4', name: 'Noah Williams', email: 'noah.w@gsautobrokers.com', role: 'Broker', hireDate: '2022-07-11', avatarUrl: PlaceHolderImages.find(img => img.id === 'user-4')?.imageUrl || '', dui: '44444444-4', supervisorId: '2' },
  { id: '5', name: 'Emma Jones', email: 'emma.j@gsautobrokers.com', role: 'Broker', hireDate: '2023-09-01', avatarUrl: PlaceHolderImages.find(img => img.id === 'user-5')?.imageUrl || '', dui: '55555555-5', supervisorId: '2' },
];

const leads: Lead[] = [
  { id: '1', name: 'John Doe', email: 'john.d@example.com', phone: '123-456-7890', company: 'Innovate Inc.', status: 'New', notes: 'Interested in a reliable family SUV. Mentioned the new Highlander model.', ownerId: '3', ownerName: 'Olivia Brown', channel: 'Facebook', createdAt: '2024-05-01T10:00:00Z' },
  { id: '2', name: 'Jane Smith', email: 'jane.s@example.com', phone: '234-567-8901', company: 'Solutions Co.', status: 'Contacted', notes: 'Looking for a luxury sedan, budget around $50k. Booked a test drive for the Lexus ES.', ownerId: '4', ownerName: 'Noah Williams', channel: 'WhatsApp', createdAt: '2024-05-03T11:00:00Z' },
  { id: '3', name: 'Sam Wilson', email: 'sam.w@example.com', phone: '345-678-9012', company: 'Tech Forward', status: 'Qualified', notes: 'Needs a fleet of 5 mid-size sedans for corporate use. Sent initial proposal.', ownerId: '2', ownerName: 'Liam Smith', channel: 'Call', createdAt: '2024-05-05T09:30:00Z' },
  { id: '4', name: 'Patricia Garcia', email: 'pat.g@example.com', phone: '456-789-0123', company: 'Global Exports', status: 'Proposal', notes: 'Evaluating our proposal against a competitor. Follow up on Friday.', ownerId: '3', ownerName: 'Olivia Brown', channel: 'Visit', createdAt: '2024-04-28T14:00:00Z' },
  { id: '5', name: 'Michael Brown', email: 'mike.b@example.com', phone: '567-890-1234', company: 'HealthFirst', status: 'Closed', notes: 'Sale closed for a Toyota Camry. Happy customer.', ownerId: '4', ownerName: 'Noah Williams', channel: 'Facebook', createdAt: '2024-04-20T16:00:00Z' },
  { id: '6', name: 'Linda Davis', email: 'linda.d@example.com', phone: '678-901-2345', company: 'BuildRight', status: 'Lost', notes: 'Chose a competitor due to pricing. Sent a thank-you note.', ownerId: '5', ownerName: 'Emma Jones', channel: 'Other', createdAt: '2024-04-15T12:00:00Z' },
  { id: '7', name: 'James Johnson', email: 'james.j@example.com', phone: '789-012-3456', company: 'Innovate Inc.', status: 'Closed', notes: 'Repeat customer, looking to trade in his old car for a new truck.', ownerId: '5', ownerName: 'Emma Jones', channel: 'Call', createdAt: '2024-05-10T10:00:00Z' },
  { id: '8', name: 'Barbara Miller', email: 'barb.m@example.com', phone: '890-123-4567', company: 'MarketFresh', status: 'Contacted', notes: 'Wants an electric vehicle. Discussed the Mustang Mach-E.', ownerId: '3', ownerName: 'Olivia Brown', channel: 'Visit', createdAt: '2024-05-12T15:00:00Z' },
];

const articles: Article[] = [
    {
        id: '1',
        title: 'Mastering the Initial Client Call',
        content: 'The initial client call is your first, and perhaps most crucial, opportunity to make a lasting impression. Start by introducing yourself and GS Auto Brokers clearly. The primary goal is to listen. Understand the client\'s needs, preferences, and what prompted their call. Use open-ended questions like, "What are you looking for in your next vehicle?" or "What features are most important to you and your family?" Avoid jumping into sales pitches. Instead, focus on building rapport and trust. Summarize their needs at the end of the call to confirm your understanding and outline the next steps, whether it\'s sending them specific vehicle information or scheduling a test drive. Remember, this first conversation sets the tone for the entire relationship.',
        author: 'Ava Johnson',
        date: '2023-10-26',
        tags: ['Sales', 'Client Interaction'],
        category: 'Sales',
    },
    {
        id: '2',
        title: 'Effective Negotiation Strategies',
        content: 'Negotiation is a dialogue, not a battle. The goal is to reach a mutually beneficial agreement. Begin by understanding the client\'s budget and expectations. Present the vehicle\'s value proposition clearly, highlighting its features, condition, and market value. When discussing price, anchor the conversation with the asking price but show flexibility. Use phrases like, "While the list price is X, let\'s see what we can do to make this work for you." Always maintain a positive and respectful tone. If you reach an impasse, suggest creative solutions like including a service package or accessories. A successful negotiation leaves the client feeling they got a fair deal, strengthening their loyalty to GS Auto Brokers.',
        author: 'Liam Smith',
        date: '2023-11-05',
        tags: ['Negotiation', 'Sales Process'],
        category: 'Process',
    },
    {
        id: '3',
        title: 'Leveraging Our CRM for Lead Management',
        content: 'Our CRM is the backbone of our sales operation. Consistent and detailed data entry is non-negotiable. Every interaction with a lead—calls, emails, test drives—must be logged in real-time. Use the lead status field to accurately track where each client is in the sales funnel (e.g., "New," "Contacted," "Qualified"). Set follow-up tasks for every lead to ensure no opportunity slips through the cracks. Regularly review your lead pipeline to prioritize high-potential clients. Use the notes section to record personal details and preferences; this information is invaluable for personalizing your communication and building a strong relationship.',
        author: 'Ava Johnson',
        date: '2023-11-12',
        tags: ['CRM', 'Productivity', 'Tools'],
        category: 'Tools',
    },
    {
        id: '4',
        title: 'Product Deep Dive: The 2024 Electric Sedan Lineup',
        content: 'The 2024 electric sedan market is more competitive than ever. Our lineup features three key models. The Model E offers an industry-leading range of 400 miles and rapid charging capabilities, making it perfect for long-distance commuters. The Lux-EV focuses on premium interior finishes, advanced driver-assist features, and a silent, smooth ride, targeting the luxury segment. The City-Volt is our budget-friendly option, ideal for urban driving with a compact design and 250-mile range. Be prepared to discuss charging infrastructure, battery longevity, and government incentives. Hands-on experience is key, so encourage clients to test drive each model to feel the difference in performance and handling.',
        author: 'Noah Williams',
        date: '2023-11-20',
        tags: ['Product', 'Electric Vehicles'],
        category: 'Products',
    },
];

const salesData = [
  { name: 'Jan', total: 4200 },
  { name: 'Feb', total: 3800 },
  { name: 'Mar', total: 5500 },
  { name: 'Apr', total: 4800 },
  { name: 'May', total: 6200 },
  { name: 'Jun', total: 7100 },
  { name: 'Jul', total: 6500 },
  { name: 'Aug', total: 5900 },
  { name: 'Sep', total: 6800 },
  { name: 'Oct', total: 7500 },
  { name: 'Nov', total: 8200 },
  { name: 'Dec', total: 9100 },
];

export const REVENUE_PER_VEHICLE = 30000;
export const COMMISSION_PER_VEHICLE = 500;
export const MARGIN_PER_VEHICLE = 2500;

export const getLeads = (): Lead[] => leads;
export const getStaff = (): Staff[] => staff;
export const getArticles = (): Article[] => articles;
export const getArticleById = (id: string): Article | undefined => articles.find(a => a.id === id);
export const getSalesData = () => salesData;
