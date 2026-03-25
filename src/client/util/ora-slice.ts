export class OraSlice {
	static lex(input: string) {
		const output = input.match(
			/(['"])(.*?)\1|\w+|(?!\\)[~!@#$%^&*{}()-_+"'\\/.;:\[\]\s]|[\uD83C-\uDBFF\uDC00-\uDFFF]+/g,
		);

		if (output == null) {
			// throw "This is a blank file!";
			return [];
		}
		while (output.indexOf(" ") != -1) {
			output.splice(output.indexOf(" "), 1);
		}
		return output;
	}

	static chunk(lexed: any[]) {
		const chunks = [];
		let chunk = [];
		let scopeDepth = 0;

		for (const item of lexed) {
			if (item === "(") scopeDepth++;
			else if (item === ")") scopeDepth--;

			if (item === ";" && scopeDepth === 0) {
				chunks.push(chunk);
				chunk = [];
			} else if (!["\n", "\t", "\r"].includes(item)) chunk.push(item);
		}

		return chunks;
	}

	static parseVec(values: string[]) {
		const captured: any[] = [];

		if (values[0] != "(" || values[values.length - 1] != ")") {
			return captured;
		}

		for (let i = 1; i < values.length - 1; i++) {
			if (i % 2 == 0) {
				if (values[i] != ",") {
					return captured;
				}
			} else {
				captured.push(values[i]);
			}
		}

		return captured;
	}

	static getValues(input: string) {
		const lexed = OraSlice.lex(input);

		const source: { x: number; y: number; width: number; height: number } =
			{
				x: 0,
				y: 0,
				width: 0,
				height: 0,
			};

		const destination: {
			x: number;
			y: number;
			width: number;
			height: number;
		} = {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
		};

		const index: { x: number; y: number; width?: number; height?: number } =
			{
				x: 0,
				y: 0,
			};

		for (const [key, ...vec] of OraSlice.chunk(lexed)) {
			switch (key) {
				case "s": {
					const v_s = OraSlice.parseVec(vec).map(Number);
					source.x = v_s[0] ?? 0;
					source.y = v_s[1] ?? 0;
					source.width = v_s[2] ?? 0;
					source.height = v_s[3] ?? 0;
					break;
				}
				case "d": {
					const v_d = OraSlice.parseVec(vec).map(Number);
					destination.x = v_d[0] ?? 0;
					destination.y = v_d[1] ?? 0;
					destination.width = v_d[2] ?? 0;
					destination.height = v_d[3] ?? 0;
					break;
				}
				case "i": {
					const v_i = OraSlice.parseVec(vec).map(Number);
					index.x = v_i[0] ?? 0;
					index.y = v_i[1] ?? 0;

					if (v_i.length >= 3) {
						index.width = v_i[2] ?? 0;
						if (v_i.length >= 4) {
							index.height = v_i[3] ?? 0;
						}
					}
					break;
				}
			}
		}

		if (index.x != 0 && index.width != 0) {
			source.x += source.width * index.x;
		}

		if (index.y != 0 && index.height != 0) {
			source.y += (index.height || source.height) * index.y;
		}

		return {
			source,
			destination,
		};
	}
}
