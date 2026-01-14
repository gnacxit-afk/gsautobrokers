import { redirect } from 'next/navigation'

// This is a temporary component to redirect to the correct dashboard.
// In a real app, you might have a generic dashboard here.
export default function Dashboard() {
    redirect('/leads')
}
