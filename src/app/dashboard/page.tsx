"use client";
import { useSession } from "@/lib/auth-client"
import {redirect} from "next/navigation";

export default function DashboardPage() {
    const { data: session } = useSession()
    if(session===null){
        redirect("/sign-in")
    }
    return (
        <div>
            <p>Dashboard</p>
        </div>
    );
}