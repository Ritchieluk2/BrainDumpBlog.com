// Shape of the signed-in user stored in the encrypted session cookie.
declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    /** What to call them ("Good morning, Sam."). Optional. */
    name?: string | null
    /** Their journal's title, shown on the journal page. Optional. */
    journalName?: string | null
  }

  interface UserSession {
    loggedInAt: number
  }
}

export {}
