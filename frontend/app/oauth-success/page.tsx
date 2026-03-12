'use client'

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function OAuthSuccess() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const token = params.get("token")
    const email = params.get("email")
    const isNew = params.get("is_new")

    if (!token) {
      router.push("/login")
      return
    }

    localStorage.setItem("access_token", token)
    if (email) localStorage.setItem("user_email", email)

    router.push(isNew === "True" ? "/onboarding" : "/home")
  }, [params, router])

  return <p>Signing you in...</p>
}