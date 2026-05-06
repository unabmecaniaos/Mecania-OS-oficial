import { cookies } from "next/headers";

const FLASH_COOKIE_NAME = "mecaniaos_flash";

export type FlashTone = "success" | "error" | "info";

export type FlashMessage = {
  message: string;
  tone: FlashTone;
};

export async function setFlashMessage(input: FlashMessage) {
  const cookieStore = await cookies();

  cookieStore.set(
    FLASH_COOKIE_NAME,
    JSON.stringify({
      message: input.message,
      tone: input.tone,
    }),
    {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60,
    },
  );
}

export async function consumeFlashMessage(): Promise<FlashMessage | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(FLASH_COOKIE_NAME)?.value;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as FlashMessage;

    if (!parsed?.message || !parsed?.tone) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function clearFlashMessage() {
  const cookieStore = await cookies();

  cookieStore.set(FLASH_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    expires: new Date(0),
  });
}
