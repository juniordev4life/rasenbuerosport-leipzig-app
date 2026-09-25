import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
	AVATAR_MAX_BYTES,
	MATCH_STATS_MAX_BYTES,
} from "../../src/lib/constants/upload.constants.js";

const RULES = readFileSync(
	join(import.meta.dirname, "../../storage.rules"),
	"utf8",
);

const OWNER_UID = "owner-uid";
const OTHER_UID = "other-uid";
const GAME_ID = "0b3f8a52-4c1e-4f5e-9a7d-2e6c1d9b8f40";
const AVATAR_PATH = `avatars/${OWNER_UID}/avatar.png`;
const STATS_PATH = `match-stats/${GAME_ID}/overview.jpg`;

/** Token claims of a colleague as Google sign-in issues them. */
const REDBULLS_TOKEN = {
	email: "max.mustermann@redbulls.com",
	email_verified: true,
};

/**
 * Accounts the API's requireAuth turns away. None of them may write.
 * `null` stands for a request without any ID token.
 */
const REJECTED_ACCOUNTS = [
	["no ID token", null],
	[
		"an unverified redbulls.com address",
		{ ...REDBULLS_TOKEN, email_verified: false },
	],
	["a gmail.com account", { email: "max@gmail.com", email_verified: true }],
	[
		"a lookalike domain",
		{ email: "max@evilredbulls.com", email_verified: true },
	],
	[
		"a domain suffix",
		{ email: "max@redbulls.com.evil.com", email_verified: true },
	],
	["a subdomain", { email: "max@mail.redbulls.com", email_verified: true }],
	["a token without email", { email_verified: true }],
	["a token without email_verified", { email: REDBULLS_TOKEN.email }],
	[
		"email_verified as a string",
		{ email: REDBULLS_TOKEN.email, email_verified: "true" },
	],
];

let testEnv;

/**
 * A client signed in as `uid` with the given token claims, or signed out
 * when `token` is null.
 * @param {object|null} token
 * @param {string} [uid]
 */
function client(token, uid = OWNER_UID) {
	return token === null
		? testEnv.unauthenticatedContext()
		: testEnv.authenticatedContext(uid, token);
}

/**
 * Uploads `size` bytes to `path` the way the app does (`uploadBytes`).
 * @param {import('@firebase/rules-unit-testing').RulesTestContext} context
 * @param {string} path
 * @param {{ size?: number, contentType?: string }} [file]
 */
async function upload(
	context,
	path,
	{ size = 1024, contentType = "image/png" } = {},
) {
	return context.storage().ref(path).put(new Uint8Array(size), { contentType });
}

/**
 * Creates an object with rules disabled, as the Admin SDK or gsutil would.
 * @param {string} path
 * @param {string} [contentType]
 */
async function seed(path, contentType = "image/png") {
	await testEnv.withSecurityRulesDisabled(async (context) => {
		await upload(context, path, { contentType });
	});
}

/** Deletes every object in the bucket, including nested ones. */
async function clearBucket() {
	await testEnv.withSecurityRulesDisabled(async (context) => {
		const deleteAll = async (ref) => {
			const { items, prefixes } = await ref.listAll();
			await Promise.all([
				...items.map((item) => item.delete()),
				...prefixes.map(deleteAll),
			]);
		};
		await deleteAll(context.storage().ref());
	});
}

beforeAll(async () => {
	testEnv = await initializeTestEnvironment({
		projectId: "demo-rasenbuerosport",
		storage: { rules: RULES },
	});
});

afterAll(async () => {
	await testEnv?.cleanup();
});

beforeEach(async () => {
	await clearBucket();
});

describe("avatars/{uid}/{fileName}", () => {
	it("lets a verified redbulls.com colleague upload their own avatar", async () => {
		await assertSucceeds(upload(client(REDBULLS_TOKEN), AVATAR_PATH));
	});

	it("compares the email domain case-insensitively, like the API", async () => {
		const token = { ...REDBULLS_TOKEN, email: "Max.Mustermann@RedBulls.com" };

		await assertSucceeds(upload(client(token), AVATAR_PATH));
	});

	it.each(
		REJECTED_ACCOUNTS,
	)("rejects an upload from %s", async (_label, token) => {
		await assertFails(upload(client(token), AVATAR_PATH));
	});

	it.each(
		REJECTED_ACCOUNTS,
	)("rejects replacing an existing avatar by %s", async (_label, token) => {
		await seed(AVATAR_PATH);

		await assertFails(upload(client(token), AVATAR_PATH));
	});

	it("rejects an upload into another user's folder", async () => {
		await assertFails(
			upload(client(REDBULLS_TOKEN), `avatars/${OTHER_UID}/avatar.png`),
		);
	});

	it("rejects replacing another user's existing avatar", async () => {
		const otherAvatar = `avatars/${OTHER_UID}/avatar.png`;
		await seed(otherAvatar);

		await assertFails(upload(client(REDBULLS_TOKEN), otherAvatar));
	});

	it("rejects a metadata change on another user's avatar", async () => {
		const otherAvatar = `avatars/${OTHER_UID}/avatar.png`;
		await seed(otherAvatar);
		const ref = client(REDBULLS_TOKEN).storage().ref(otherAvatar);

		await assertFails(ref.updateMetadata({ cacheControl: "no-store" }));
	});

	it("lets the owner replace their avatar", async () => {
		await seed(AVATAR_PATH);

		await assertSucceeds(upload(client(REDBULLS_TOKEN), AVATAR_PATH));
	});

	it("accepts exactly AVATAR_MAX_BYTES, the limit the app enforces", async () => {
		await assertSucceeds(
			upload(client(REDBULLS_TOKEN), AVATAR_PATH, { size: AVATAR_MAX_BYTES }),
		);
	});

	it("rejects a file over AVATAR_MAX_BYTES", async () => {
		await assertFails(
			upload(client(REDBULLS_TOKEN), AVATAR_PATH, {
				size: AVATAR_MAX_BYTES + 1,
			}),
		);
	});

	it.each([
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/heic",
	])("accepts %s", async (contentType) => {
		await assertSucceeds(
			upload(client(REDBULLS_TOKEN), AVATAR_PATH, { contentType }),
		);
	});

	it.each([
		"image/svg+xml",
		"image/SVG+XML",
		"text/html",
		"application/pdf",
		"application/octet-stream",
	])("rejects %s", async (contentType) => {
		await assertFails(
			upload(client(REDBULLS_TOKEN), AVATAR_PATH, { contentType }),
		);
	});

	it("rejects a metadata change to a non-image type", async () => {
		await seed(AVATAR_PATH);
		const ref = client(REDBULLS_TOKEN).storage().ref(AVATAR_PATH);

		await assertFails(ref.updateMetadata({ contentType: "text/html" }));
	});

	it("rejects a nested path", async () => {
		await assertFails(
			upload(client(REDBULLS_TOKEN), `avatars/${OWNER_UID}/sub/avatar.png`),
		);
	});

	it("rejects a delete, even by the owner", async () => {
		await seed(AVATAR_PATH);
		const ref = client(REDBULLS_TOKEN).storage().ref(AVATAR_PATH);

		await assertFails(ref.delete());
	});

	it("lets anyone read an avatar, signed in or not", async () => {
		await seed(AVATAR_PATH);
		const ref = client(null).storage().ref(AVATAR_PATH);

		await assertSucceeds(ref.getMetadata());
	});

	it.each([
		["avatars", "a colleague", REDBULLS_TOKEN],
		["avatars", "a signed-out client", null],
		[`avatars/${OWNER_UID}`, "the owner", REDBULLS_TOKEN],
		[`avatars/${OWNER_UID}`, "a signed-out client", null],
	])("rejects listing %s by %s", async (folder, _label, token) => {
		await seed(AVATAR_PATH);
		const ref = client(token).storage().ref(folder);

		await assertFails(ref.listAll());
	});
});

describe("match-stats/{gameId}/{fileName}", () => {
	it("lets a verified redbulls.com colleague upload a screenshot and read it back", async () => {
		const ref = client(REDBULLS_TOKEN).storage().ref(STATS_PATH);

		await assertSucceeds(
			ref.put(new Uint8Array(1024), { contentType: "image/jpeg" }),
		);
		await assertSucceeds(ref.getDownloadURL());
	});

	it("accepts a PNG under the .jpg name, as resizeImage passes narrow images through", async () => {
		await assertSucceeds(
			upload(client(REDBULLS_TOKEN), STATS_PATH, { contentType: "image/png" }),
		);
	});

	it.each(
		REJECTED_ACCOUNTS,
	)("rejects an upload from %s", async (_label, token) => {
		await assertFails(upload(client(token), STATS_PATH));
	});

	it.each(
		REJECTED_ACCOUNTS,
	)("rejects replacing an existing screenshot by %s", async (_label, token) => {
		await seed(STATS_PATH);

		await assertFails(upload(client(token), STATS_PATH));
	});

	it.each(
		REJECTED_ACCOUNTS,
	)("rejects a metadata change on a screenshot by %s", async (_label, token) => {
		await seed(STATS_PATH);
		const ref = client(token).storage().ref(STATS_PATH);

		await assertFails(ref.updateMetadata({ cacheControl: "no-store" }));
	});

	it("lets a colleague replace a screenshot for a retry", async () => {
		await seed(STATS_PATH);

		await assertSucceeds(upload(client(REDBULLS_TOKEN, OTHER_UID), STATS_PATH));
	});

	it("accepts exactly MATCH_STATS_MAX_BYTES, the limit the app enforces", async () => {
		await assertSucceeds(
			upload(client(REDBULLS_TOKEN), STATS_PATH, {
				size: MATCH_STATS_MAX_BYTES,
			}),
		);
	});

	it("rejects a file over MATCH_STATS_MAX_BYTES", async () => {
		await assertFails(
			upload(client(REDBULLS_TOKEN), STATS_PATH, {
				size: MATCH_STATS_MAX_BYTES + 1,
			}),
		);
	});

	it.each([
		"image/svg+xml",
		"text/html",
		"video/mp4",
	])("rejects %s", async (contentType) => {
		await assertFails(
			upload(client(REDBULLS_TOKEN), STATS_PATH, { contentType }),
		);
	});

	it("rejects a nested path", async () => {
		await assertFails(
			upload(client(REDBULLS_TOKEN), `match-stats/${GAME_ID}/sub/overview.jpg`),
		);
	});

	it("rejects a delete", async () => {
		await seed(STATS_PATH);
		const ref = client(REDBULLS_TOKEN).storage().ref(STATS_PATH);

		await assertFails(ref.delete());
	});

	it.each(REJECTED_ACCOUNTS)("rejects a read by %s", async (_label, token) => {
		await seed(STATS_PATH);
		const ref = client(token).storage().ref(STATS_PATH);

		await assertFails(ref.getMetadata());
	});

	it.each([
		"match-stats",
		`match-stats/${GAME_ID}`,
	])("rejects listing %s, even by a colleague", async (folder) => {
		await seed(STATS_PATH);
		const ref = client(REDBULLS_TOKEN).storage().ref(folder);

		await assertFails(ref.listAll());
	});
});

describe("team-logos/**", () => {
	it("lets anyone read a logo, signed in or not", async () => {
		await seed("team-logos/85.png");
		const ref = client(null).storage().ref("team-logos/85.png");

		await assertSucceeds(ref.getMetadata());
	});

	it("rejects an upload, even by a colleague", async () => {
		await assertFails(upload(client(REDBULLS_TOKEN), "team-logos/85.png"));
	});

	it("rejects listing logos", async () => {
		await seed("team-logos/85.png");
		const ref = client(null).storage().ref("team-logos");

		await assertFails(ref.listAll());
	});
});

describe("paths only the API and the capture pipeline write", () => {
	it.each([
		"talkshow/2026-05-18.mp3",
		"match-reports/report.mp3",
		"feedback-screenshots/screenshot.png",
		"highlights/game.mp4",
		"avatar.png",
	])("rejects a client upload to %s", async (path) => {
		await assertFails(upload(client(REDBULLS_TOKEN), path));
	});

	it("rejects listing the bucket root", async () => {
		await seed("feedback-screenshots/screenshot.png");
		const ref = client(REDBULLS_TOKEN).storage().ref();

		await assertFails(ref.listAll());
	});

	it("rejects a client read, as those objects are served through public URLs", async () => {
		await seed("feedback-screenshots/screenshot.png");
		const ref = client(REDBULLS_TOKEN)
			.storage()
			.ref("feedback-screenshots/screenshot.png");

		await assertFails(ref.getMetadata());
	});
});

describe("download URLs", () => {
	it("serves an avatar's download URL to a signed-out browser", async () => {
		const ref = client(REDBULLS_TOKEN).storage().ref(AVATAR_PATH);
		await ref.put(new Uint8Array(1024), { contentType: "image/png" });
		const url = await ref.getDownloadURL();

		const response = await fetch(url);

		expect(url).toContain("token=");
		expect(response.status).toBe(200);
	});

	it("serves a screenshot's download URL without auth, while the bare URL stays closed", async () => {
		const ref = client(REDBULLS_TOKEN).storage().ref(STATS_PATH);
		await ref.put(new Uint8Array(1024), { contentType: "image/jpeg" });
		const url = await ref.getDownloadURL();
		const bareUrl = url.replace(/&token=[^&]+/, "");

		const [withToken, withoutToken] = await Promise.all([
			fetch(url),
			fetch(bareUrl),
		]);

		expect(withToken.status).toBe(200);
		expect(withoutToken.status).toBe(403);
	});

	it("serves a team logo through the token-less URL the teams table stores", async () => {
		await seed("team-logos/85.png");
		const { host, port } = testEnv.emulators.storage;
		const url = `http://${host}:${port}/v0/b/demo-rasenbuerosport/o/team-logos%2F85.png?alt=media`;

		const response = await fetch(url);

		expect(response.status).toBe(200);
	});
});
