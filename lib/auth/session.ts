import { auth } from "@/lib/auth/config";

export async function getSession() {
  return auth();
}

export async function requireSession() {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  return session;
}
