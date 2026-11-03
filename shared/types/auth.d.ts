// Shape of the signed-in user stored in the encrypted session cookie.
declare module '#auth-utils' {
  interface User {
    id: string
    email: string
  }

  interface UserSession {
    loggedInAt: number
  }
}

export {}
