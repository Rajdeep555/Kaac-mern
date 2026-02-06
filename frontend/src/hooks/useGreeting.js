import { useState, useEffect } from "react";

export const useGreeting = () => {
    const [greeting, setGreeting] = useState("")

    useEffect(() => {
        const date = new Date()
        const hours = date.getHours()

        if (hours < 12) setGreeting("Good Morning")
        else if (hours < 18) setGreeting("Good Afternoon")
        else setGreeting("Good Evening")
    }, [])

    return greeting;
}