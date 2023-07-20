class Color {
	r = 0;
	g = 0;
	b = 0;
	
	constructor(r, g, b) {
		this.r = r;
		this.g = g;
		this.b = b;
	}
	
	static rgb(r, g, b) {
		return new Color(r, g, b);
	}
	
	static hex(str) {
		if (str[0] !== '#' || str.length !== 7) {
			throw new Error("Invalid hex code: " + str);
		}
		return Color.rgb(
			parseInt(str.slice(1,3), 16),
			parseInt(str.slice(3,5), 16),
			parseInt(str.slice(5,7), 16)
		);
	}
	
	static random() {
		return Color.rgb(
			randomBetween(0, 255),
			randomBetween(0, 255),
			randomBetween(0, 255)
		);
	}
	
	toString() {
		return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
	}
	
	equals(color) {
		return this.r === color.r && this.g === color.g && this.b === color.b;
	}
	
	static aliceblue = Color.hex("#f0f8ff");
	static antiquewhite = Color.hex("#faebd7");
	static aqua = Color.hex("#00ffff");
	static aquamarine = Color.hex("#7fffd4");
	static azure = Color.hex("#f0ffff");
	static beige = Color.hex("#f5f5dc");
	static bisque = Color.hex("#ffe4c4");
	static black = Color.hex("#000000");
	static blanchedalmond = Color.hex("#ffebcd");
	static blue = Color.hex("#0000ff");
	static blueviolet = Color.hex("#8a2be2");
	static brown = Color.hex("#a52a2a");
	static burlywood = Color.hex("#deb887");
	static cadetblue = Color.hex("#5f9ea0");
	static chartreuse = Color.hex("#7fff00");
	static chocolate = Color.hex("#d2691e");
	static coral = Color.hex("#ff7f50");
	static cornflowerblue = Color.hex("#6495ed");
	static cornsilk = Color.hex("#fff8dc");
	static crimson = Color.hex("#dc143c");
	static cyan = Color.hex("#00ffff");
	static darkblue = Color.hex("#00008b");
	static darkcyan = Color.hex("#008b8b");
	static darkgoldenrod = Color.hex("#b8860b");
	static darkgray = Color.hex("#a9a9a9");
	static darkgreen = Color.hex("#006400");
	static darkkhaki = Color.hex("#bdb76b");
	static darkmagenta = Color.hex("#8b008b");
	static darkolivegreen = Color.hex("#556b2f");
	static darkorange = Color.hex("#ff8c00");
	static darkorchid = Color.hex("#9932cc");
	static darkred = Color.hex("#8b0000");
	static darksalmon = Color.hex("#e9967a");
	static darkseagreen = Color.hex("#8fbc8f");
	static darkslateblue = Color.hex("#483d8b");
	static darkslategray = Color.hex("#2f4f4f");
	static darkturquoise = Color.hex("#00ced1");
	static darkviolet = Color.hex("#9400d3");
	static deeppink = Color.hex("#ff1493");
	static deepskyblue = Color.hex("#00bfff");
	static dimgray = Color.hex("#696969");
	static dodgerblue = Color.hex("#1e90ff");
	static firebrick = Color.hex("#b22222");
	static floralwhite = Color.hex("#fffaf0");
	static forestgreen = Color.hex("#228b22");
	static fuchsia = Color.hex("#ff00ff");
	static gainsboro = Color.hex("#dcdcdc");
	static ghostwhite = Color.hex("#f8f8ff");
	static gold = Color.hex("#ffd700");
	static goldenrod = Color.hex("#daa520");
	static gray = Color.hex("#808080");
	static green = Color.hex("#008000");
	static greenyellow = Color.hex("#adff2f");
	static honeydew = Color.hex("#f0fff0");
	static hotpink = Color.hex("#ff69b4");
	static indianred  = Color.hex("#cd5c5c");
	static indigo = Color.hex("#4b0082");
	static ivory = Color.hex("#fffff0");
	static khaki = Color.hex("#f0e68c");
	static lavender = Color.hex("#e6e6fa");
	static lavenderblush = Color.hex("#fff0f5");
	static lawngreen = Color.hex("#7cfc00");
	static lemonchiffon = Color.hex("#fffacd");
	static lightblue = Color.hex("#add8e6");
	static lightcoral = Color.hex("#f08080");
	static lightcyan = Color.hex("#e0ffff");
	static lightgoldenrodyellow = Color.hex("#fafad2");
	static lightgrey = Color.hex("#d3d3d3");
	static lightgreen = Color.hex("#90ee90");
	static lightpink = Color.hex("#ffb6c1");
	static lightsalmon = Color.hex("#ffa07a");
	static lightseagreen = Color.hex("#20b2aa");
	static lightskyblue = Color.hex("#87cefa");
	static lightslategray = Color.hex("#778899");
	static lightsteelblue = Color.hex("#b0c4de");
	static lightyellow = Color.hex("#ffffe0");
	static lime = Color.hex("#00ff00");
	static limegreen = Color.hex("#32cd32");
	static linen = Color.hex("#faf0e6");
	static magenta = Color.hex("#ff00ff");
	static maroon = Color.hex("#800000");
	static mediumaquamarine = Color.hex("#66cdaa");
	static mediumblue = Color.hex("#0000cd");
	static mediumorchid = Color.hex("#ba55d3");
	static mediumpurple = Color.hex("#9370d8");
	static mediumseagreen = Color.hex("#3cb371");
	static mediumslateblue = Color.hex("#7b68ee");
	static mediumspringgreen = Color.hex("#00fa9a");
	static mediumturquoise = Color.hex("#48d1cc");
	static mediumvioletred = Color.hex("#c71585");
	static midnightblue = Color.hex("#191970");
	static mintcream = Color.hex("#f5fffa");
	static mistyrose = Color.hex("#ffe4e1");
	static moccasin = Color.hex("#ffe4b5");
	static navajowhite = Color.hex("#ffdead");
	static navy = Color.hex("#000080");
	static oldlace = Color.hex("#fdf5e6");
	static olive = Color.hex("#808000");
	static olivedrab = Color.hex("#6b8e23");
	static orange = Color.hex("#ffa500");
	static orangered = Color.hex("#ff4500");
	static orchid = Color.hex("#da70d6");
	static palegoldenrod = Color.hex("#eee8aa");
	static palegreen = Color.hex("#98fb98");
	static paleturquoise = Color.hex("#afeeee");
	static palevioletred = Color.hex("#d87093");
	static papayawhip = Color.hex("#ffefd5");
	static peachpuff = Color.hex("#ffdab9");
	static peru = Color.hex("#cd853f");
	static pink = Color.hex("#ffc0cb");
	static plum = Color.hex("#dda0dd");
	static powderblue = Color.hex("#b0e0e6");
	static purple = Color.hex("#800080");
	static red = Color.hex("#ff0000");
	static rosybrown = Color.hex("#bc8f8f");
	static royalblue = Color.hex("#4169e1");
	static saddlebrown = Color.hex("#8b4513");
	static salmon = Color.hex("#fa8072");
	static sandybrown = Color.hex("#f4a460");
	static seagreen = Color.hex("#2e8b57");
	static seashell = Color.hex("#fff5ee");
	static sienna = Color.hex("#a0522d");
	static silver = Color.hex("#c0c0c0");
	static skyblue = Color.hex("#87ceeb");
	static slateblue = Color.hex("#6a5acd");
	static slategray = Color.hex("#708090");
	static snow = Color.hex("#fffafa");
	static springgreen = Color.hex("#00ff7f");
	static steelblue = Color.hex("#4682b4");
	static tan = Color.hex("#d2b48c");
	static teal = Color.hex("#008080");
	static thistle = Color.hex("#d8bfd8");
	static tomato = Color.hex("#ff6347");
	static turquoise = Color.hex("#40e0d0");
	static violet = Color.hex("#ee82ee");
	static wheat = Color.hex("#f5deb3");
	static white = Color.hex("#ffffff");
	static whitesmoke = Color.hex("#f5f5f5");
	static yellow = Color.hex("#ffff00");
	static yellowgreen = Color.hex("#9acd32");
}

function blend(c1, c2, w1 = 1, w2 = 1) {
	if (c1.equals(Color.black) || c2.equals(Color.black)) return Color.black;
	const r = weightedAverage(c1.r, c2.r, w1, w2);
	const g = weightedAverage(c1.g, c2.g, w1, w2);
	const b = weightedAverage(c1.b, c2.b, w1, w2);
	return Color.rgb(r, g, b);
}

function weightedAverage(x, y, wx, wy) {
	return (x * wx + y * wy) / (wx + wy);
}