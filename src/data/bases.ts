/* ============================================================
   Crew discounts — the single source of truth
   ------------------------------------------------------------
   GENERATED from the design export's siteData.js. Do not hand-edit
   the records below; edit this file directly from now on (the
   export is retired) or regenerate via scripts/gen-bases.mjs.

   This dataset feeds BOTH the on-site explorer (/crew-discounts/*)
   AND the printable flyers (/print/*). The export duplicated the
   same content across siteData.js and 12 separate flyer templates,
   so a price change had to be made in two places. It does not
   anymore.
   ============================================================ */

/** One venue. The export shipped these in two different shapes; normalized. */
export interface Venue {
  /** Display name, e.g. "Pappadeaux". */
  name: string;
  /** Supporting detail: gate, cuisine, what the deal covers. May be "". */
  detail: string;
  /** Right-rail highlight: price or percentage, e.g. "$9.95+". May be "". */
  highlight: string;
}

/** A terminal, concourse or landside area within a base. */
export interface Zone {
  name: string;
  /** Short badge shown left of the zone name, e.g. "A/B". */
  badge: string;
  /** Qualifier such as "Pre-security" or "Airside". May be "". */
  note: string;
  venues: Venue[];
}

/** A tab within a base: food, shops, percentage discounts. */
export interface Category {
  /** URL segment, e.g. "eat" | "shop" | "deals". */
  key: string;
  label: string;
  /** Phosphor icon name, e.g. "ph-fork-knife". */
  icon: string;
  zones: Zone[];
}

/** A crew base. `key` is the URL segment: /crew-discounts/<key>/ */
export interface Base {
  key: string;
  code: string;
  name: string;
  sub: string;
  blurb: string;
  categories: Category[];
}

export const bases: Base[] = [
  {
    key: "clt",
    code: "CLT",
    name: "Charlotte Douglas",
    sub: "Charlotte, NC",
    blurb: "Start in the Atrium — the central hub feeding all five concourses — then follow your gate. The Atrium boutiques and the D/E Connector brands are the most reliable for a crew discount.",
    categories: [
      {
        key: "eat", label: "Food & Drink", icon: "ph-fork-knife",
        zones: [
        {
          name: "Atrium", badge: "ATR", note: "Pre-security food court",
          venues: [
          { name: "1897 Market", detail: "", highlight: "" },
          { name: "Beaudevin", detail: "Wine Bar", highlight: "" },
          { name: "Brookwood Farms BBQ", detail: "", highlight: "" },
          { name: "Chick-fil-A", detail: "", highlight: "" },
          { name: "Hissho Sushi", detail: "", highlight: "" },
          { name: "McDonald's", detail: "", highlight: "" },
          { name: "Red Mango", detail: "", highlight: "" },
          { name: "Salsarita's", detail: "", highlight: "" },
          { name: "Starbucks", detail: "", highlight: "" },
          { name: "Tequileria", detail: "Bar", highlight: "" },
          ],
        },
        {
          name: "A Connector", badge: "A", note: "Pre-security",
          venues: [
          { name: "Rocky Mountain Chocolate Factory", detail: "", highlight: "" },
          ],
        },
        {
          name: "A/B Connector", badge: "A/B", note: "Pre-security",
          venues: [
          { name: "Dunkin'", detail: "", highlight: "" },
          ],
        },
        {
          name: "Concourse A", badge: "A", note: "Airside",
          venues: [
          { name: "Black n Blue", detail: "Bar", highlight: "" },
          { name: "Crown Diner", detail: "", highlight: "" },
          { name: "Great Wagon Road Distilling", detail: "Bar", highlight: "" },
          { name: "NoDa Brewing Company", detail: "Brewery", highlight: "" },
          { name: "Panera Bread", detail: "", highlight: "" },
          { name: "Rhino Market & Deli", detail: "", highlight: "" },
          { name: "Smashburger", detail: "", highlight: "" },
          { name: "The Taproom", detail: "Bar", highlight: "" },
          { name: "Uptown Minibar", detail: "Bar", highlight: "" },
          { name: "Wendy's", detail: "", highlight: "" },
          ],
        },
        {
          name: "Concourse B", badge: "B", note: "Airside",
          venues: [
          { name: "Bojangles", detail: "", highlight: "" },
          { name: "Midwood Smokehouse", detail: "", highlight: "" },
          { name: "Red Star Lounge", detail: "Bar", highlight: "" },
          { name: "Starbucks", detail: "", highlight: "" },
          { name: "Summer House Santa Monica", detail: "", highlight: "" },
          { name: "The Great American Bagel", detail: "", highlight: "" },
          ],
        },
        {
          name: "Concourse C", badge: "C", note: "Airside",
          venues: [
          { name: "Auntie Anne's", detail: "", highlight: "" },
          { name: "Bad Daddy's Burger Bar", detail: "", highlight: "" },
          { name: "Chalice Café", detail: "", highlight: "" },
          { name: "Cinnabon", detail: "", highlight: "" },
          { name: "PZA", detail: "", highlight: "" },
          { name: "Starbucks", detail: "", highlight: "" },
          { name: "The Waterman Fish Bar", detail: "Bar", highlight: "" },
          ],
        },
        {
          name: "Concourse D", badge: "D", note: "Airside",
          venues: [
          { name: "Chalice", detail: "Bar", highlight: "" },
          { name: "Cíao Gourmet Market", detail: "", highlight: "" },
          { name: "Hissho Sushi", detail: "", highlight: "" },
          { name: "Sammy's Beach Bar & Grill", detail: "", highlight: "" },
          { name: "Starbucks", detail: "", highlight: "" },
          { name: "The Great American Bagel", detail: "", highlight: "" },
          { name: "Triple C Brewing", detail: "Brewery", highlight: "" },
          ],
        },
        {
          name: "Concourse E", badge: "E", note: "Airside",
          venues: [
          { name: "Bojangles", detail: "", highlight: "" },
          { name: "Burger King", detail: "", highlight: "" },
          { name: "Captain Jack's Tavern", detail: "Bar", highlight: "" },
          { name: "Dunkin'", detail: "", highlight: "" },
          { name: "Einstein Bros. Bagels", detail: "", highlight: "" },
          { name: "Explorer Lounge", detail: "Bar", highlight: "" },
          { name: "La Madeleine", detail: "", highlight: "" },
          { name: "PDQ", detail: "", highlight: "" },
          { name: "Panda Express", detail: "", highlight: "" },
          { name: "Pronto", detail: "", highlight: "" },
          { name: "Starbucks", detail: "", highlight: "" },
          ],
        },
        {
          name: "D/E Connector", badge: "D/E", note: "Airside",
          venues: [
          { name: "CommonSpace", detail: "", highlight: "" },
          { name: "Jamba Juice", detail: "", highlight: "" },
          ],
        },
        {
          name: "E Rotunda", badge: "E-R", note: "Airside",
          venues: [
          { name: "PZA", detail: "", highlight: "" },
          { name: "Whisky River", detail: "Bar", highlight: "" },
          ],
        },
        {
          name: "The Plaza", badge: "PLZ", note: "Grab & go",
          venues: [
          { name: "Auntie Anne's", detail: "", highlight: "" },
          { name: "Bojangles", detail: "", highlight: "" },
          { name: "Potbelly Sandwich Shop", detail: "", highlight: "" },
          { name: "Shake Shack", detail: "", highlight: "" },
          { name: "Wicked Weed Brewing", detail: "Brewery", highlight: "" },
          ],
        },
        ],
      },
      {
        key: "shop", label: "Shops", icon: "ph-shopping-bag",
        zones: [
        {
          name: "Atrium", badge: "HUB", note: "Central hub",
          venues: [
          { name: "Baggallini", detail: "", highlight: "" },
          { name: "Catawba Trade", detail: "", highlight: "" },
          { name: "Charlotte News & Gifts", detail: "", highlight: "" },
          { name: "Johnston & Murphy", detail: "", highlight: "" },
          { name: "Market 704", detail: "", highlight: "" },
          { name: "Sound Vending", detail: "Vending", highlight: "" },
          { name: "Travel@ease", detail: "×2", highlight: "" },
          ],
        },
        {
          name: "The Plaza", badge: "PLZ", note: "Post-security",
          venues: [
          { name: "Charlotte Supply Co.", detail: "", highlight: "" },
          { name: "Dylan's Candy Bar", detail: "", highlight: "" },
          { name: "iStore", detail: "", highlight: "" },
          ],
        },
        {
          name: "A Connector", badge: "A", note: "",
          venues: [
          { name: "Charlotte's Landing", detail: "", highlight: "" },
          { name: "Rocky Mountain Chocolate Factory", detail: "", highlight: "" },
          { name: "iStore Express", detail: "", highlight: "" },
          ],
        },
        {
          name: "A/B Connector", badge: "A/B", note: "",
          venues: [
          { name: "704 Shop", detail: "", highlight: "" },
          ],
        },
        {
          name: "Concourse A", badge: "A", note: "",
          venues: [
          { name: "Charlotte News & Gifts", detail: "", highlight: "" },
          { name: "Charlotte's Landing", detail: "", highlight: "" },
          { name: "LEGO", detail: "", highlight: "" },
          { name: "Market Place", detail: "", highlight: "" },
          { name: "Travel@ease", detail: "", highlight: "" },
          { name: "TripAdvisor", detail: "", highlight: "" },
          ],
        },
        {
          name: "Concourse B", badge: "B", note: "",
          venues: [
          { name: "New South Travelmart", detail: "", highlight: "" },
          { name: "Queen City Market", detail: "", highlight: "" },
          { name: "Travel@ease", detail: "", highlight: "" },
          ],
        },
        {
          name: "Concourse C", badge: "C", note: "",
          venues: [
          { name: "Charlotte News & Gifts", detail: "", highlight: "" },
          { name: "News2You", detail: "", highlight: "" },
          { name: "On The Square Gift & News", detail: "", highlight: "" },
          { name: "The Scoreboard", detail: "", highlight: "" },
          { name: "Travel@ease", detail: "", highlight: "" },
          { name: "iStore Express", detail: "", highlight: "" },
          ],
        },
        {
          name: "Concourse D", badge: "D", note: "",
          venues: [
          { name: "3Sixty Duty Free & More", detail: "", highlight: "" },
          { name: "Travel@ease", detail: "", highlight: "" },
          { name: "TripAdvisor", detail: "", highlight: "" },
          ],
        },
        {
          name: "Concourse E", badge: "E", note: "",
          venues: [
          { name: "LEGO", detail: "", highlight: "" },
          { name: "Sound Vending", detail: "Vending", highlight: "" },
          { name: "Travel@ease", detail: "", highlight: "" },
          { name: "Uptown Exchange", detail: "", highlight: "" },
          ],
        },
        {
          name: "D/E Connector", badge: "D/E", note: "Best boutiques",
          venues: [
          { name: "Brighton", detail: "", highlight: "" },
          { name: "Hip & Humble", detail: "", highlight: "" },
          { name: "Kiehl's", detail: "", highlight: "" },
          { name: "LEGO", detail: "", highlight: "" },
          { name: "MAC / Jo Malone", detail: "", highlight: "" },
          { name: "Pandora", detail: "", highlight: "" },
          { name: "Rocky Mountain Chocolate Factory", detail: "", highlight: "" },
          { name: "Spanx", detail: "", highlight: "" },
          { name: "Tumi", detail: "", highlight: "" },
          ],
        },
        {
          name: "E Rotunda", badge: "E", note: "",
          venues: [
          { name: "Today", detail: "", highlight: "" },
          ],
        },
        {
          name: "Gate E28", badge: "E28", note: "",
          venues: [
          { name: "Charlotte News & Gifts", detail: "", highlight: "" },
          ],
        },
        {
          name: "Baggage Claim", badge: "PRE", note: "Pre-security",
          venues: [
          { name: "Charlotte News & Gifts", detail: "", highlight: "" },
          { name: "Rocky Mountain Chocolate Factory", detail: "", highlight: "" },
          { name: "Travel@ease", detail: "", highlight: "" },
          ],
        },
        ],
      },
    ],
  },
  {
    key: "dca",
    code: "DCA",
    name: "Reagan National",
    sub: "Washington, DC",
    blurb: "Compact and quick — perfect for a tight turn. Show your AA badge and ask for the crew rate before you order; it varies by spot. National Hall (Terminal 2) has the widest spread.",
    categories: [
      {
        key: "eat", label: "Food & Drink", icon: "ph-fork-knife",
        zones: [
        {
          name: "Terminal 1", badge: "T1", note: "Pre-security",
          venues: [
          { name: "Cibo Express Gourmet Market", detail: "", highlight: "" },
          { name: "District Bar", detail: "", highlight: "" },
          { name: "Dunkin' Donuts", detail: "", highlight: "" },
          { name: "Pepsi Lounge", detail: "", highlight: "" },
          ],
        },
        {
          name: "Terminal 2 — North", badge: "T2-N", note: "Security",
          venues: [
          { name: "The Cafe at DCA North", detail: "", highlight: "" },
          ],
        },
        {
          name: "Terminal 2 — South", badge: "T2-S", note: "Security",
          venues: [
          { name: "Good Boy Goodies", detail: "Vending", highlight: "" },
          { name: "The Cafe at DCA South", detail: "", highlight: "" },
          ],
        },
        {
          name: "A Gates", badge: "A", note: "Post-security",
          venues: [
          { name: "Boar's Head Delicatessen", detail: "", highlight: "" },
          { name: "Cibo Walk-Thru Gourmet Market", detail: "", highlight: "" },
          { name: "Custom Burger", detail: "", highlight: "" },
          { name: "Dunkin' Donuts", detail: "", highlight: "" },
          { name: "Reservoir", detail: "", highlight: "" },
          { name: "Tagliare", detail: "", highlight: "" },
          ],
        },
        {
          name: "B Gates", badge: "B", note: "Post-security",
          venues: [
          { name: "Atlas Brew Works", detail: "", highlight: "" },
          { name: "CAVA", detail: "", highlight: "" },
          { name: "Dunkin'", detail: "", highlight: "" },
          { name: "Farmer's Fridge", detail: "Vending", highlight: "" },
          { name: "Great American Bagel Bakery", detail: "", highlight: "" },
          { name: "Grille District", detail: "", highlight: "" },
          { name: "Half Moon Empanadas", detail: "", highlight: "" },
          { name: "Zeke's Coffee", detail: "", highlight: "" },
          ],
        },
        {
          name: "C Gates", badge: "C", note: "Post-security",
          venues: [
          { name: "CAVA", detail: "", highlight: "" },
          { name: "Colada Shop", detail: "", highlight: "" },
          { name: "Dos Toros", detail: "", highlight: "" },
          { name: "Starbucks", detail: "", highlight: "" },
          { name: "Taylor Gourmet", detail: "", highlight: "" },
          ],
        },
        {
          name: "D Gates", badge: "D", note: "Post-security",
          venues: [
          { name: "Busboys and Poets", detail: "", highlight: "" },
          { name: "Busboys and Poets Express", detail: "", highlight: "" },
          { name: "Five Guys", detail: "", highlight: "" },
          { name: "Georgetown Gourmet Market", detail: "", highlight: "" },
          { name: "Kapnos Taverna", detail: "", highlight: "" },
          { name: "Nalley Fresh", detail: "", highlight: "" },
          { name: "Starbucks", detail: "", highlight: "" },
          ],
        },
        {
          name: "E Gates", badge: "E", note: "Post-security",
          venues: [
          { name: "Elevation Burger", detail: "", highlight: "" },
          { name: "Mezeh Mediterranean Grill", detail: "", highlight: "" },
          { name: "P.F. Chang's", detail: "", highlight: "" },
          { name: "Peet's Coffee", detail: "", highlight: "" },
          { name: "Timber Pizza Co.", detail: "", highlight: "" },
          { name: "Wolfgang Puck Bar & Bites", detail: "", highlight: "" },
          ],
        },
        {
          name: "National Hall", badge: "HALL", note: "Widest spread",
          venues: [
          { name: "Ben's Chili Bowl", detail: "", highlight: "" },
          { name: "Blondie's Bakery Box", detail: "", highlight: "" },
          { name: "Chick-fil-A", detail: "", highlight: "" },
          { name: "Dunkin' Donuts", detail: "", highlight: "" },
          { name: "Eastern Market", detail: "", highlight: "" },
          { name: "Half Moon Empanadas", detail: "", highlight: "" },
          { name: "Legal Sea Foods", detail: "", highlight: "" },
          { name: "Lucky Buns", detail: "", highlight: "" },
          { name: "Matsutake Sushi", detail: "", highlight: "" },
          { name: "On The Fly by Capital One Landing", detail: "", highlight: "" },
          { name: "Vino Volo", detail: "", highlight: "" },
          ],
        },
        ],
      },
      {
        key: "shop", label: "Shops", icon: "ph-shopping-bag",
        zones: [
        {
          name: "Terminal 1", badge: "T1", note: "Pre-security",
          venues: [
          { name: "CTY", detail: "", highlight: "" },
          { name: "Farmer's Fridge", detail: "Vending", highlight: "" },
          ],
        },
        {
          name: "A Gates", badge: "A", note: "Pre-security",
          venues: [
          { name: "Pepsi", detail: "Vending ×2", highlight: "" },
          { name: "Starbucks", detail: "Vending", highlight: "" },
          ],
        },
        {
          name: "Parking Area", badge: "PARK", note: "Pre-security",
          venues: [
          { name: "Pepsi", detail: "Vending ×2", highlight: "" },
          ],
        },
        {
          name: "Terminal 2 — Baggage Claim", badge: "BAG", note: "Pre-security",
          venues: [
          { name: "Pepsi", detail: "Vending ×2", highlight: "" },
          ],
        },
        {
          name: "A Gates", badge: "A", note: "Post-security",
          venues: [
          { name: "Page", detail: "", highlight: "" },
          ],
        },
        {
          name: "B Gates", badge: "B", note: "Post-security",
          venues: [
          { name: "DC Arts District Market", detail: "", highlight: "" },
          { name: "Inside the Beltway", detail: "", highlight: "" },
          { name: "Pepsi", detail: "Vending", highlight: "" },
          { name: "Snacks On The Go", detail: "Vending", highlight: "" },
          ],
        },
        {
          name: "C Gates", badge: "C", note: "Post-security",
          venues: [
          { name: "Monumental News", detail: "", highlight: "" },
          ],
        },
        {
          name: "D Gates", badge: "D", note: "Post-security",
          venues: [
          { name: "Hudson News", detail: "", highlight: "" },
          { name: "Pen & Prose Boutique Express", detail: "", highlight: "" },
          ],
        },
        {
          name: "E Gates", badge: "E", note: "Post-security",
          venues: [
          { name: "Capitol File News", detail: "", highlight: "" },
          { name: "DC Originals", detail: "", highlight: "" },
          { name: "InMotion", detail: "", highlight: "" },
          { name: "WH Smith", detail: "", highlight: "" },
          ],
        },
        {
          name: "National Hall", badge: "HALL", note: "Best boutiques",
          venues: [
          { name: "BOSS", detail: "", highlight: "" },
          { name: "Capital Image", detail: "", highlight: "" },
          { name: "Capital One Landing", detail: "", highlight: "" },
          { name: "Capital Tops", detail: "", highlight: "" },
          { name: "Johnston & Murphy", detail: "", highlight: "" },
          { name: "Lego", detail: "", highlight: "" },
          { name: "MAC", detail: "", highlight: "" },
          { name: "MelanBrand Skin", detail: "", highlight: "" },
          { name: "Smithsonian Museum Store", detail: "", highlight: "" },
          { name: "Solid State Books", detail: "", highlight: "" },
          { name: "TUMI", detail: "", highlight: "" },
          { name: "The Goods @DCA", detail: "", highlight: "" },
          { name: "The Neighborgoods", detail: "", highlight: "" },
          { name: "Uniquely D.C.", detail: "", highlight: "" },
          { name: "iStore", detail: "", highlight: "" },
          ],
        },
        ],
      },
    ],
  },
  {
    key: "dfw",
    code: "DFW",
    name: "Dallas / Fort Worth",
    sub: "Dallas, TX",
    blurb: "Big airport, real deals — many spots have a set crew price or 10–20% off with your AA badge. Terminals A & C have printed crew menus; E & B have the percentage discounts. Prices change, so confirm at the register. Most don't apply if you dine in.",
    categories: [
      {
        key: "eat", label: "Meal Deals", icon: "ph-fork-knife",
        zones: [
        {
          name: "Terminal A", badge: "A", note: "Gates A13–A28 · crew menus",
          venues: [
          { name: "Ling & Louie's", detail: "Gate A13 · Asian — Orange Peel Chicken, Lucky Lo Mein, Uncle Fu's Fried Rice, Burger & Fries, Kale Caesar Salad (each $10)", highlight: "$10" },
          { name: "TGI Fridays", detail: "Gate A13 — Burger & Fries $9, Chicken Fingers & Fries $9, Quesadilla $9, Crew tender plate $8", highlight: "$8–9" },
          { name: "Pappadeaux", detail: "Gate A24 · Seafood — Shrimp Gumbo & Salad $9.95, Chicken Tenders $12.99, Fried Shrimp $14.99, Fried Catfish $14.99, Crawfish Platter $17.99", highlight: "$9.95+" },
          { name: "Pappasito's Cantina", detail: "Gate A28 · Mexican — Breakfast Burrito $7.99, Tortilla Soup $6.99, Taco w/ Rice & Beans $7.99, Nachos w/ Beef $11.99, Fajita Salad $11.99, Burritos $11.99", highlight: "$6.99+" },
          { name: "Popeyes", detail: "Gate A16 — 2-Piece Chicken, Side & Drink", highlight: "$7.99" },
          { name: "Salt Lick · BBQ", detail: "Show badge & ask at register", highlight: "A17" },
          { name: "Twisted Root Burger", detail: "Show badge & ask at register", highlight: "Term A" },
          { name: "Qdoba · Mexican", detail: "Show badge & ask at register", highlight: "A15" },
          ],
        },
        {
          name: "Terminal C", badge: "C", note: "Gates C6–C33 · crew menus",
          venues: [
          { name: "Shake Shack", detail: "Gate C6 — Burger & Fries, Cheeseburger & Fries, or Hot Dog & Fries", highlight: "$9" },
          { name: "Dickey's BBQ Pit", detail: "Gate C6 — Pulled Pork Sandwich", highlight: "$5.95" },
          { name: "TGI Fridays", detail: "Gates C8 · C30 — Burger & Fries, Chicken Fingers & Fries, Quesadilla", highlight: "$9" },
          { name: "Pappadeaux", detail: "Gate C14 · Seafood — Shrimp Gumbo & Salad $9.95, Chicken Tenders $12.99, Fried Shrimp $14.99, Fried Catfish $14.99, Crawfish Platter $17.99, Blackened Catfish & Étouffée $17.99", highlight: "$9.95+" },
          { name: "Au Bon Pain", detail: "Gates C22 · C33 — Sandwich & Drink", highlight: "$8" },
          { name: "Uno Due Go", detail: "Gate C33 — Small Pizza, Drink & Chips", highlight: "$8" },
          { name: "Pappasito's Cantina", detail: "Term C — Nachos, Taco or Enchilada", highlight: "$8.99" },
          ],
        },
        {
          name: "Terminal D", badge: "D", note: "International · sit-down — ask at register",
          venues: [
          { name: "3 Forks Steakhouse", detail: "Steaks — crew rate varies", highlight: "Term D" },
          { name: "Cantina Laredo", detail: "Tex-Mex — crew rate varies", highlight: "B / D" },
          { name: "Gas Monkey Bar & Grill", detail: "Bar & Grill — crew rate varies", highlight: "Term D" },
          { name: "Blue Mesa Grill", detail: "Southwest — crew rate varies", highlight: "Term D" },
          ],
        },
        ],
      },
      {
        key: "deals", label: "% Discounts", icon: "ph-seal-percent",
        zones: [
        {
          name: "Terminal E", badge: "E", note: "Gates E5–E37",
          venues: [
          { name: "Drew Pearson's Sports 88", detail: "E5", highlight: "10% off" },
          { name: "Auntie Anne's", detail: "E6 — Pretzels $1.29 Tuesdays, BOGO other days", highlight: "10% off" },
          { name: "Chick-Fil-A", detail: "E6", highlight: "10% off" },
          { name: "Dunkin'", detail: "E8", highlight: "10% off" },
          { name: "IHOP Express", detail: "E8", highlight: "15% off" },
          { name: "Love Shack", detail: "E11", highlight: "10% off" },
          { name: "Einstein Bros", detail: "E13", highlight: "15% off" },
          { name: "Sonny's BBQ", detail: "E13", highlight: "10% off" },
          { name: "7-Eleven", detail: "E13 — orders over $5", highlight: "10% off" },
          { name: "TGI Fridays", detail: "E17 — fingers, cheeseburger, quesadilla, Caesar, sandwich+chips $10 (to-go only); 10% off else", highlight: "$10 / 10%" },
          { name: "Peet's Coffee", detail: "E18", highlight: "5% off" },
          { name: "Jimmy John's", detail: "E21", highlight: "10% off" },
          { name: "Jamba", detail: "E21", highlight: "10% off" },
          { name: "CNBC Store", detail: "E22", highlight: "20% off" },
          { name: "Starbucks", detail: "E26", highlight: "10% off" },
          { name: "AV8", detail: "E26 — food", highlight: "15% off" },
          { name: "Dickey's", detail: "E27A — pulled pork sandwich $6, 10% off else", highlight: "$6 / 10%" },
          { name: "Whataburger", detail: "E27A", highlight: "10% off" },
          { name: "La Crème / TV 5 Travel", detail: "E31 — food", highlight: "20% off" },
          { name: "2.0 Taco & Tequila", detail: "E31", highlight: "20% off" },
          { name: "Panda Express", detail: "E33", highlight: "15% off" },
          { name: "Wendy's", detail: "E33", highlight: "5% off" },
          { name: "Lick", detail: "E33 — candy", highlight: "10% off" },
          { name: "Starbucks", detail: "E34", highlight: "10% off" },
          { name: "TV 5 Travel", detail: "E36 — food", highlight: "20% off" },
          { name: "Unos", detail: "E37 — deep dish + soda $10; breakfast burrito + coffee $6.50; 10% off else", highlight: "$10 / 10%" },
          ],
        },
        {
          name: "Terminal B", badge: "B", note: "Gates B4–B48",
          venues: [
          { name: "Plum Market", detail: "B4", highlight: "10% off" },
          { name: "Dunkin'", detail: "B5", highlight: "10% off" },
          { name: "TGI Fridays", detail: "B7 — fingers, cheeseburger, quesadilla, Caesar, sandwich+chips $10; 10% off else", highlight: "$10 / 10%" },
          { name: "Red Mango", detail: "B9", highlight: "10% off" },
          { name: "Cousins BBQ", detail: "B12 — employee menu", highlight: "15% off" },
          { name: "Smashburger", detail: "B12", highlight: "15% off" },
          { name: "Texas Monthly / Starbucks", detail: "B12", highlight: "10% off" },
          { name: "Panda Express", detail: "B17", highlight: "15% off" },
          { name: "Hickory", detail: "B24 — employee menu", highlight: "10% off" },
          { name: "Subway", detail: "B24", highlight: "5% off" },
          { name: "Garrett Popcorn", detail: "B28", highlight: "15% off" },
          { name: "Decanted", detail: "B28", highlight: "10% off" },
          { name: "Wingstop", detail: "B28", highlight: "Emp. menu" },
          { name: "Starbucks", detail: "B28", highlight: "10% off" },
          { name: "Hudson Nonstop", detail: "B28", highlight: "None" },
          { name: "Cantina Laredo", detail: "B29", highlight: "10% off" },
          { name: "Auntie Anne's", detail: "B29 — Pretzels $1.29 Tuesdays, BOGO other days", highlight: "10% off" },
          { name: "Caribou Coffee", detail: "B29", highlight: "10% off" },
          { name: "McAlister's Deli", detail: "B41", highlight: "10% off" },
          { name: "Natalie's Candy Jar", detail: "B41", highlight: "10% off" },
          { name: "McDonald's", detail: "B41", highlight: "15% off" },
          { name: "Cousins BBQ", detail: "B43 — employee menu", highlight: "15% off" },
          { name: "Dunkin' / Baskin-Robbins", detail: "B43", highlight: "10% off" },
          { name: "Cousin's Back Porch", detail: "B48", highlight: "15% off" },
          ],
        },
        ],
      },
    ],
  },
  {
    key: "phl",
    code: "PHL",
    name: "Philadelphia Int'l",
    sub: "Philadelphia, PA",
    blurb: "Terminals A–F with a long connector — everything's airside and connected, so walk the B/C connector (the classic crew stop) if your terminal's quiet. Show your AA badge and ask; the rate varies by spot.",
    categories: [
      {
        key: "eat", label: "Food & Drink", icon: "ph-fork-knife",
        zones: [
        {
          name: "Terminal A — East", badge: "A", note: "Airside",
          venues: [
          { name: "Currito Burrito", detail: "", highlight: "" },
          { name: "Gachi House of Sushi & Noodles", detail: "", highlight: "" },
          ],
        },
        {
          name: "Terminal A — West", badge: "A", note: "Airside",
          venues: [
          { name: "Bruegger's Bagels", detail: "", highlight: "" },
          { name: "Chickie's & Pete's", detail: "", highlight: "" },
          { name: "Dunkin'", detail: "", highlight: "" },
          { name: "Illy Caffè", detail: "", highlight: "" },
          ],
        },
        {
          name: "Terminal B", badge: "B", note: "Airside",
          venues: [
          { name: "Auntie Anne's", detail: "", highlight: "" },
          { name: "Boule Cafe", detail: "", highlight: "" },
          { name: "CIBO Bistro & Wine Bar", detail: "", highlight: "" },
          { name: "CIBO Express Gourmet Markets", detail: "", highlight: "" },
          { name: "Dogs on the Fly", detail: "", highlight: "" },
          { name: "Independence Prime", detail: "", highlight: "" },
          { name: "LOVE Grille", detail: "", highlight: "" },
          { name: "La Colombe", detail: "", highlight: "" },
          { name: "Mezzogiorno", detail: "", highlight: "" },
          { name: "Noobar", detail: "", highlight: "" },
          { name: "Passyunk Steaks", detail: "", highlight: "" },
          { name: "Tagliare", detail: "", highlight: "" },
          { name: "Tailgate", detail: "", highlight: "" },
          ],
        },
        {
          name: "B/C Connector", badge: "B·C", note: "Classic crew stop",
          venues: [
          { name: "Dos Toros", detail: "", highlight: "" },
          { name: "Elixr Coffee", detail: "", highlight: "" },
          { name: "Federal Donuts & Chicken", detail: "", highlight: "" },
          { name: "Gachi House of Sushi & Noodles", detail: "", highlight: "" },
          { name: "Geno's Steaks", detail: "", highlight: "" },
          { name: "La Colombe", detail: "", highlight: "" },
          { name: "Oyster House", detail: "", highlight: "" },
          ],
        },
        {
          name: "Terminal C", badge: "C", note: "Airside",
          venues: [
          { name: "Aldo Lamberti Trattoria", detail: "", highlight: "" },
          { name: "Bud & Marilyn's", detail: "", highlight: "" },
          { name: "Chickie's & Pete's", detail: "", highlight: "" },
          { name: "Insomnia Cookies", detail: "", highlight: "" },
          { name: "Jamba Juice", detail: "", highlight: "" },
          { name: "Jim's South St. Famous Cheesesteaks", detail: "", highlight: "" },
          { name: "Paris Baguette", detail: "", highlight: "" },
          { name: "Sabrina's Cafe", detail: "", highlight: "" },
          { name: "Starbucks", detail: "", highlight: "" },
          ],
        },
        {
          name: "Terminal D", badge: "D", note: "Airside",
          venues: [
          { name: "Bar Symon", detail: "", highlight: "" },
          { name: "Dunkin'", detail: "", highlight: "" },
          { name: "Middle Child", detail: "", highlight: "" },
          ],
        },
        {
          name: "Terminal E", badge: "E", note: "Airside",
          venues: [
          { name: "Auntie Anne's", detail: "", highlight: "" },
          { name: "Burger King", detail: "", highlight: "" },
          { name: "Chick-Fil-A", detail: "", highlight: "" },
          { name: "Chickie's & Pete's", detail: "", highlight: "" },
          { name: "Gachi House of Sushi & Noodles", detail: "", highlight: "" },
          { name: "Good Luck Bar & Restaurant", detail: "", highlight: "" },
          { name: "La Colombe", detail: "", highlight: "" },
          { name: "Pennsylvania Market", detail: "", highlight: "" },
          { name: "Subway", detail: "", highlight: "" },
          { name: "Yummy Pretzels", detail: "", highlight: "" },
          ],
        },
        {
          name: "Terminal F", badge: "F", note: "Airside",
          venues: [
          { name: "La Colombe", detail: "", highlight: "" },
          { name: "Local Tavern", detail: "", highlight: "" },
          { name: "Philly Pretzel Factory", detail: "", highlight: "" },
          { name: "Qdoba", detail: "", highlight: "" },
          { name: "Sbarro", detail: "", highlight: "" },
          { name: "Smashburger", detail: "", highlight: "" },
          { name: "Tony Luke's", detail: "", highlight: "" },
          { name: "Urban Juicer", detail: "", highlight: "" },
          { name: "WinKitchen", detail: "", highlight: "" },
          ],
        },
        ],
      },
      {
        key: "shop", label: "Shops", icon: "ph-shopping-bag",
        zones: [
        {
          name: "Terminal A — East", badge: "A-E", note: "Airside",
          venues: [
          { name: "CXI Currency Exchange", detail: "", highlight: "" },
          { name: "Duty Free by 3Sixty", detail: "", highlight: "" },
          { name: "Hudson News", detail: "", highlight: "" },
          { name: "FuelRod", detail: "Kiosk", highlight: "" },
          { name: "FIFA World Cup 2026", detail: "Machine", highlight: "" },
          ],
        },
        {
          name: "Terminal A — West", badge: "A-W", note: "Airside",
          venues: [
          { name: "Desigual", detail: "", highlight: "" },
          { name: "Duty Free by 3Sixty", detail: "×2", highlight: "" },
          { name: "Evolve", detail: "", highlight: "" },
          { name: "Good 2 Go", detail: "", highlight: "" },
          { name: "Hudson News", detail: "", highlight: "" },
          { name: "FuelRod", detail: "Kiosk", highlight: "" },
          ],
        },
        {
          name: "Terminal B", badge: "B", note: "Airside",
          venues: [
          { name: "Carry On", detail: "", highlight: "" },
          { name: "Gadget Express", detail: "", highlight: "" },
          { name: "SGR", detail: "", highlight: "" },
          { name: "FuelRod", detail: "Kiosk", highlight: "" },
          ],
        },
        {
          name: "B/C Connector", badge: "B/C", note: "Widest selection",
          venues: [
          { name: "Brighton Collectibles", detail: "", highlight: "" },
          { name: "Coach", detail: "", highlight: "" },
          { name: "Heritage Books", detail: "", highlight: "" },
          { name: "InMotion Entertainment", detail: "", highlight: "" },
          { name: "Johnston & Murphy", detail: "", highlight: "" },
          { name: "LEGO Store", detail: "", highlight: "" },
          { name: "Onsite Travel Essentials", detail: "", highlight: "" },
          { name: "PGA Tour", detail: "", highlight: "" },
          { name: "Penn's Landing Market", detail: "", highlight: "" },
          { name: "PHL Marketplace", detail: "", highlight: "" },
          { name: "PHL Sports", detail: "", highlight: "" },
          { name: "Philadelphia Sports Edition", detail: "", highlight: "" },
          ],
        },
        {
          name: "Terminal C", badge: "C", note: "Airside",
          venues: [
          { name: "InMotion Entertainment", detail: "", highlight: "" },
          { name: "Onsite News", detail: "", highlight: "" },
          { name: "TODAY", detail: "", highlight: "" },
          { name: "travel@ease", detail: "", highlight: "" },
          { name: "FuelRod", detail: "Kiosk", highlight: "" },
          { name: "Lottery Machine", detail: "", highlight: "" },
          ],
        },
        {
          name: "Gate C18", badge: "C18", note: "",
          venues: [
          { name: "Insomnia Cookies", detail: "", highlight: "" },
          ],
        },
        {
          name: "Terminal D", badge: "D", note: "Airside",
          venues: [
          { name: "Hudson News", detail: "", highlight: "" },
          { name: "LEGO", detail: "", highlight: "" },
          { name: "Philadelphia Tribune", detail: "", highlight: "" },
          { name: "Sound", detail: "", highlight: "" },
          { name: "Stellar Express", detail: "", highlight: "" },
          { name: "The Everything Travel Store", detail: "", highlight: "" },
          { name: "FuelRod", detail: "Kiosk", highlight: "" },
          { name: "FIFA World Cup 2026", detail: "Machine ×2", highlight: "" },
          ],
        },
        {
          name: "D/E Connector", badge: "D/E", note: "Boutiques",
          venues: [
          { name: "Beauty On The Fly", detail: "", highlight: "" },
          { name: "Good 2 Go", detail: "", highlight: "" },
          { name: "Hudson News", detail: "", highlight: "" },
          { name: "InMotion Entertainment", detail: "", highlight: "" },
          { name: "Kiehl's", detail: "", highlight: "" },
          { name: "Lids", detail: "", highlight: "" },
          { name: "Life is Good", detail: "", highlight: "" },
          { name: "Marika", detail: "", highlight: "" },
          { name: "Stellar Books", detail: "", highlight: "" },
          { name: "Vera Bradley", detail: "", highlight: "" },
          ],
        },
        {
          name: "Terminal E", badge: "E", note: "Airside",
          venues: [
          { name: "Black Friday", detail: "", highlight: "" },
          { name: "Hudson News", detail: "×2", highlight: "" },
          { name: "Lego", detail: "", highlight: "" },
          { name: "Sound", detail: "", highlight: "" },
          { name: "Stellar News", detail: "", highlight: "" },
          { name: "FuelRod", detail: "Kiosk", highlight: "" },
          ],
        },
        {
          name: "Terminal F", badge: "F", note: "Airside",
          venues: [
          { name: "Brookstone", detail: "", highlight: "" },
          { name: "Good 2 Go", detail: "×2", highlight: "" },
          { name: "Hudson News", detail: "×5", highlight: "" },
          { name: "Kiehl's", detail: "", highlight: "" },
          { name: "Sound Balance", detail: "", highlight: "" },
          { name: "Sunglass Hut", detail: "", highlight: "" },
          { name: "re:vive", detail: "", highlight: "" },
          { name: "FuelRod", detail: "Kiosk ×3", highlight: "" },
          ],
        },
        {
          name: "Baggage Claim", badge: "BAG", note: "Landside",
          venues: [
          { name: "Dogs on the Fly", detail: "", highlight: "" },
          { name: "FuelRod", detail: "Kiosk", highlight: "" },
          ],
        },
        ],
      },
    ],
  },
];

/** Lookup by URL segment. */
export const baseByKey = new Map(bases.map((b) => [b.key, b]));

/** Total venues in a category — used for the tab counts. */
export function venueCount(category: Category): number {
  return category.zones.reduce((n, z) => n + z.venues.length, 0);
}
