export class CanvasRender {
    static Image(context, image, from = [], to = []) {
        if ((image instanceof HTMLImageElement ||
            image instanceof HTMLCanvasElement ||
            image instanceof OffscreenCanvas) != true)
            return;
        const [preX = 0, preY = 0, preW = image.width, preH = image.height] = Array.isArray(from) ? from : [];
        const [x = 0, y = 0, w = image.width, h = image.height] = Array.isArray(to) ? to : [];
        try {
            context.drawImage(image, preX, preY, preW, preH, x, y, w, h);
        }
        catch (err) { }
    }
    static text(context, text, { x, y, w }) {
        x = x | 0;
        y = y | 0;
        context.fillText(text, x, y, w);
    }
    static circle(context, values) {
        let { x = 0, y = 0, radius = 10, percent, stroke, strokeWidth } = values;
        if (typeof percent === 'number') {
            const color = context.fillStyle;
            radius = radius / 2;
            context.save();
            context.beginPath();
            let amt = ((2 / 100) * percent) + 1.5;
            if (amt > 2) {
                amt = amt - 2;
            }
            context.arc(x, y, radius, amt * Math.PI, 1.5 * Math.PI, false);
            context.fillStyle = 'transparent';
            context.fill();
            context.lineWidth = strokeWidth !== null && strokeWidth !== void 0 ? strokeWidth : (radius - .3) * 2;
            context.strokeStyle = color;
            context.stroke();
            context.restore();
        }
        else {
            context.save();
            context.beginPath();
            context.arc(x, y, radius, 0, 2 * Math.PI, false);
            context.fill();
            if (typeof stroke == 'string') {
                if (typeof strokeWidth === 'number') {
                    context.lineWidth = strokeWidth;
                }
                context.strokeStyle = stroke;
                context.stroke();
            }
            context.restore();
        }
    }
}
