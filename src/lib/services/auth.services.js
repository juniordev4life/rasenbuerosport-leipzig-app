import { auth, googleProvider } from "$lib/config/firebase.config.js";
import { signInWithPopup, signOut } from "firebase/auth";

/**
 * Signs in with Google via popup
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function loginWithGoogle() {
	return signInWithPopup(auth, googleProvider);
}

/**
 * Signs out the current user
 * @returns {Promise<void>}
 */
export async function logout() {
	await signOut(auth);
}
