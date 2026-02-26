/**
 * Football teams with league and country metadata.
 * Used for autocomplete and future league-based statistics.
 * The `name` field is stored in the DB as plain text – league/country
 * can always be resolved via this constant.
 *
 * @typedef {object} FootballTeam
 * @property {string} name - Team display name
 * @property {string} league - League name
 * @property {string} country - Country code (ISO 3166-1 alpha-2)
 */

/** @type {FootballTeam[]} */
export const FOOTBALL_TEAMS = [
	// --- Bundesliga (Germany) ---
	{ name: "1. FC Heidenheim", league: "Bundesliga", country: "DE" },
	{ name: "1. FC Union Berlin", league: "Bundesliga", country: "DE" },
	{ name: "Bayer Leverkusen", league: "Bundesliga", country: "DE" },
	{ name: "Bayern München", league: "Bundesliga", country: "DE" },
	{ name: "Borussia Dortmund", league: "Bundesliga", country: "DE" },
	{ name: "Borussia Mönchengladbach", league: "Bundesliga", country: "DE" },
	{ name: "Eintracht Frankfurt", league: "Bundesliga", country: "DE" },
	{ name: "FC Augsburg", league: "Bundesliga", country: "DE" },
	{ name: "FC St. Pauli", league: "Bundesliga", country: "DE" },
	{ name: "Hoffenheim", league: "Bundesliga", country: "DE" },
	{ name: "Holstein Kiel", league: "Bundesliga", country: "DE" },
	{ name: "Mainz 05", league: "Bundesliga", country: "DE" },
	{ name: "RB Leipzig", league: "Bundesliga", country: "DE" },
	{ name: "SC Freiburg", league: "Bundesliga", country: "DE" },
	{ name: "SV Werder Bremen", league: "Bundesliga", country: "DE" },
	{ name: "VfB Stuttgart", league: "Bundesliga", country: "DE" },
	{ name: "VfL Bochum", league: "Bundesliga", country: "DE" },
	{ name: "VfL Wolfsburg", league: "Bundesliga", country: "DE" },

	// --- 2. Bundesliga (Germany) ---
	{ name: "1. FC Kaiserslautern", league: "2. Bundesliga", country: "DE" },
	{ name: "1. FC Köln", league: "2. Bundesliga", country: "DE" },
	{ name: "1. FC Magdeburg", league: "2. Bundesliga", country: "DE" },
	{ name: "1. FC Nürnberg", league: "2. Bundesliga", country: "DE" },
	{ name: "Darmstadt 98", league: "2. Bundesliga", country: "DE" },
	{ name: "Eintracht Braunschweig", league: "2. Bundesliga", country: "DE" },
	{ name: "Fortuna Düsseldorf", league: "2. Bundesliga", country: "DE" },
	{ name: "Greuther Fürth", league: "2. Bundesliga", country: "DE" },
	{ name: "Hamburger SV", league: "2. Bundesliga", country: "DE" },
	{ name: "Hannover 96", league: "2. Bundesliga", country: "DE" },
	{ name: "Hertha BSC", league: "2. Bundesliga", country: "DE" },
	{ name: "Jahn Regensburg", league: "2. Bundesliga", country: "DE" },
	{ name: "Karlsruher SC", league: "2. Bundesliga", country: "DE" },
	{ name: "Preußen Münster", league: "2. Bundesliga", country: "DE" },
	{ name: "SC Paderborn", league: "2. Bundesliga", country: "DE" },
	{ name: "Schalke 04", league: "2. Bundesliga", country: "DE" },
	{ name: "SSV Ulm 1846", league: "2. Bundesliga", country: "DE" },
	{ name: "SV Elversberg", league: "2. Bundesliga", country: "DE" },

	// --- Premier League (England) ---
	{ name: "Arsenal", league: "Premier League", country: "GB" },
	{ name: "Aston Villa", league: "Premier League", country: "GB" },
	{ name: "Bournemouth", league: "Premier League", country: "GB" },
	{ name: "Brentford", league: "Premier League", country: "GB" },
	{ name: "Brighton & Hove Albion", league: "Premier League", country: "GB" },
	{ name: "Chelsea", league: "Premier League", country: "GB" },
	{ name: "Crystal Palace", league: "Premier League", country: "GB" },
	{ name: "Everton", league: "Premier League", country: "GB" },
	{ name: "Fulham", league: "Premier League", country: "GB" },
	{ name: "Ipswich Town", league: "Premier League", country: "GB" },
	{ name: "Leicester City", league: "Premier League", country: "GB" },
	{ name: "Liverpool", league: "Premier League", country: "GB" },
	{ name: "Manchester City", league: "Premier League", country: "GB" },
	{ name: "Manchester United", league: "Premier League", country: "GB" },
	{ name: "Newcastle United", league: "Premier League", country: "GB" },
	{ name: "Nottingham Forest", league: "Premier League", country: "GB" },
	{ name: "Southampton", league: "Premier League", country: "GB" },
	{ name: "Tottenham Hotspur", league: "Premier League", country: "GB" },
	{ name: "West Ham United", league: "Premier League", country: "GB" },
	{ name: "Wolverhampton Wanderers", league: "Premier League", country: "GB" },

	// --- La Liga (Spain) ---
	{ name: "Athletic Bilbao", league: "La Liga", country: "ES" },
	{ name: "Atletico Madrid", league: "La Liga", country: "ES" },
	{ name: "Barcelona", league: "La Liga", country: "ES" },
	{ name: "Celta Vigo", league: "La Liga", country: "ES" },
	{ name: "Deportivo Alavés", league: "La Liga", country: "ES" },
	{ name: "Espanyol", league: "La Liga", country: "ES" },
	{ name: "Getafe", league: "La Liga", country: "ES" },
	{ name: "Girona", league: "La Liga", country: "ES" },
	{ name: "Las Palmas", league: "La Liga", country: "ES" },
	{ name: "Leganés", league: "La Liga", country: "ES" },
	{ name: "Mallorca", league: "La Liga", country: "ES" },
	{ name: "Osasuna", league: "La Liga", country: "ES" },
	{ name: "Rayo Vallecano", league: "La Liga", country: "ES" },
	{ name: "Real Betis", league: "La Liga", country: "ES" },
	{ name: "Real Madrid", league: "La Liga", country: "ES" },
	{ name: "Real Sociedad", league: "La Liga", country: "ES" },
	{ name: "Real Valladolid", league: "La Liga", country: "ES" },
	{ name: "Sevilla", league: "La Liga", country: "ES" },
	{ name: "Valencia", league: "La Liga", country: "ES" },
	{ name: "Villarreal", league: "La Liga", country: "ES" },

	// --- Serie A (Italy) ---
	{ name: "AC Milan", league: "Serie A", country: "IT" },
	{ name: "Atalanta", league: "Serie A", country: "IT" },
	{ name: "Bologna", league: "Serie A", country: "IT" },
	{ name: "Cagliari", league: "Serie A", country: "IT" },
	{ name: "Como 1907", league: "Serie A", country: "IT" },
	{ name: "Empoli", league: "Serie A", country: "IT" },
	{ name: "Fiorentina", league: "Serie A", country: "IT" },
	{ name: "Genoa", league: "Serie A", country: "IT" },
	{ name: "Hellas Verona", league: "Serie A", country: "IT" },
	{ name: "Inter Milan", league: "Serie A", country: "IT" },
	{ name: "Juventus", league: "Serie A", country: "IT" },
	{ name: "Lazio", league: "Serie A", country: "IT" },
	{ name: "Lecce", league: "Serie A", country: "IT" },
	{ name: "Monza", league: "Serie A", country: "IT" },
	{ name: "Napoli", league: "Serie A", country: "IT" },
	{ name: "Parma", league: "Serie A", country: "IT" },
	{ name: "Roma", league: "Serie A", country: "IT" },
	{ name: "Torino", league: "Serie A", country: "IT" },
	{ name: "Udinese", league: "Serie A", country: "IT" },
	{ name: "Venezia", league: "Serie A", country: "IT" },

	// --- Ligue 1 (France) ---
	{ name: "Angers SCO", league: "Ligue 1", country: "FR" },
	{ name: "Auxerre", league: "Ligue 1", country: "FR" },
	{ name: "Brest", league: "Ligue 1", country: "FR" },
	{ name: "Le Havre", league: "Ligue 1", country: "FR" },
	{ name: "Lens", league: "Ligue 1", country: "FR" },
	{ name: "Lille", league: "Ligue 1", country: "FR" },
	{ name: "Marseille", league: "Ligue 1", country: "FR" },
	{ name: "Monaco", league: "Ligue 1", country: "FR" },
	{ name: "Montpellier", league: "Ligue 1", country: "FR" },
	{ name: "Nantes", league: "Ligue 1", country: "FR" },
	{ name: "Nice", league: "Ligue 1", country: "FR" },
	{ name: "Olympique Lyon", league: "Ligue 1", country: "FR" },
	{ name: "PSG", league: "Ligue 1", country: "FR" },
	{ name: "Reims", league: "Ligue 1", country: "FR" },
	{ name: "Rennes", league: "Ligue 1", country: "FR" },
	{ name: "Saint-Étienne", league: "Ligue 1", country: "FR" },
	{ name: "Strasbourg", league: "Ligue 1", country: "FR" },
	{ name: "Toulouse", league: "Ligue 1", country: "FR" },

	// --- Eredivisie (Netherlands) ---
	{ name: "Ajax Amsterdam", league: "Eredivisie", country: "NL" },
	{ name: "AZ Alkmaar", league: "Eredivisie", country: "NL" },
	{ name: "FC Groningen", league: "Eredivisie", country: "NL" },
	{ name: "FC Twente", league: "Eredivisie", country: "NL" },
	{ name: "FC Utrecht", league: "Eredivisie", country: "NL" },
	{ name: "Feyenoord", league: "Eredivisie", country: "NL" },
	{ name: "Go Ahead Eagles", league: "Eredivisie", country: "NL" },
	{ name: "NEC Nijmegen", league: "Eredivisie", country: "NL" },
	{ name: "PSV Eindhoven", league: "Eredivisie", country: "NL" },
	{ name: "Sparta Rotterdam", league: "Eredivisie", country: "NL" },

	// --- Liga Portugal ---
	{ name: "Benfica", league: "Liga Portugal", country: "PT" },
	{ name: "Braga", league: "Liga Portugal", country: "PT" },
	{ name: "Casa Pia", league: "Liga Portugal", country: "PT" },
	{ name: "Famalicao", league: "Liga Portugal", country: "PT" },
	{ name: "FC Porto", league: "Liga Portugal", country: "PT" },
	{ name: "Moreirense", league: "Liga Portugal", country: "PT" },
	{ name: "Rio Ave", league: "Liga Portugal", country: "PT" },
	{ name: "Santa Clara", league: "Liga Portugal", country: "PT" },
	{ name: "Sporting CP", league: "Liga Portugal", country: "PT" },
	{ name: "Vitória Guimarães", league: "Liga Portugal", country: "PT" },

	// --- Süper Lig (Turkey) ---
	{ name: "Besiktas", league: "Süper Lig", country: "TR" },
	{ name: "Fenerbahce", league: "Süper Lig", country: "TR" },
	{ name: "Galatasaray", league: "Süper Lig", country: "TR" },
	{ name: "Istanbul Basaksehir", league: "Süper Lig", country: "TR" },
	{ name: "Trabzonspor", league: "Süper Lig", country: "TR" },

	// --- Austrian Bundesliga ---
	{ name: "LASK", league: "Austrian Bundesliga", country: "AT" },
	{ name: "Rapid Wien", league: "Austrian Bundesliga", country: "AT" },
	{ name: "RB Salzburg", league: "Austrian Bundesliga", country: "AT" },
	{ name: "Sturm Graz", league: "Austrian Bundesliga", country: "AT" },
	{ name: "Wolfsberger AC", league: "Austrian Bundesliga", country: "AT" },

	// --- Swiss Super League ---
	{ name: "Basel", league: "Swiss Super League", country: "CH" },
	{ name: "FC Zürich", league: "Swiss Super League", country: "CH" },
	{ name: "Luzern", league: "Swiss Super League", country: "CH" },
	{ name: "Servette", league: "Swiss Super League", country: "CH" },
	{ name: "Young Boys", league: "Swiss Super League", country: "CH" },

	// --- Belgian Pro League ---
	{ name: "Anderlecht", league: "Belgian Pro League", country: "BE" },
	{ name: "Antwerp", league: "Belgian Pro League", country: "BE" },
	{ name: "Club Brugge", league: "Belgian Pro League", country: "BE" },
	{ name: "Gent", league: "Belgian Pro League", country: "BE" },
	{ name: "Standard Liège", league: "Belgian Pro League", country: "BE" },

	// --- Scottish Premiership ---
	{ name: "Aberdeen", league: "Scottish Premiership", country: "GB" },
	{ name: "Celtic", league: "Scottish Premiership", country: "GB" },
	{ name: "Hearts", league: "Scottish Premiership", country: "GB" },
	{ name: "Rangers", league: "Scottish Premiership", country: "GB" },

	// --- International / Other ---
	{ name: "Al Ahly", league: "Egyptian Premier League", country: "EG" },
	{ name: "Al Hilal", league: "Saudi Pro League", country: "SA" },
	{ name: "Al Nassr", league: "Saudi Pro League", country: "SA" },
	{ name: "Boca Juniors", league: "Liga Profesional", country: "AR" },
	{ name: "Club America", league: "Liga MX", country: "MX" },
	{ name: "Flamengo", league: "Brasileirão", country: "BR" },
	{ name: "Fluminense", league: "Brasileirão", country: "BR" },
	{ name: "Jeonbuk Hyundai Motors", league: "K League 1", country: "KR" },
	{ name: "Monterrey", league: "Liga MX", country: "MX" },
	{ name: "Olympiacos", league: "Super League Greece", country: "GR" },
	{ name: "Palmeiras", league: "Brasileirão", country: "BR" },
	{ name: "Peñarol", league: "Primera División", country: "UY" },
	{ name: "River Plate", league: "Liga Profesional", country: "AR" },
	{ name: "Santos", league: "Brasileirão", country: "BR" },
	{ name: "São Paulo", league: "Brasileirão", country: "BR" },
	{ name: "Urawa Red Diamonds", league: "J1 League", country: "JP" },
];

/**
 * Helper to find team metadata by name
 * @param {string} teamName - The team name as stored in DB
 * @returns {FootballTeam|undefined}
 */
export function getTeamByName(teamName) {
	return FOOTBALL_TEAMS.find((t) => t.name === teamName);
}

/**
 * Country flag emoji from ISO country code
 * @param {string} countryCode - ISO 3166-1 alpha-2 code
 * @returns {string} Flag emoji
 */
export function getCountryFlag(countryCode) {
	if (!countryCode || countryCode.length !== 2) return "";
	const offset = 127397;
	return String.fromCodePoint(
		...[...countryCode.toUpperCase()].map((c) => c.charCodeAt(0) + offset),
	);
}
