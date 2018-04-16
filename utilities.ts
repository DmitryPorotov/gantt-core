export class Utilities {
  public static SVG_NS: 'http://www.w3.org/2000/svg' = 'http://www.w3.org/2000/svg';

  public static ca_(name: string): WrappedSVGElement {

    return new WrappedSVGElement(document.createElementNS(Utilities.SVG_NS, name));
  }

  public static addDay(date: Date, numDays = 1): Date {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + numDays);
    return d;
  }
}

export class WrappedSVGElement {
  private readonly proxy;
  public constructor(public element: SVGElement) {
    this.proxy = new Proxy(this, {
      get: (proxy, name) => {
        if (this.hasOwnProperty(name)) {
          return this[name];
        }
        if (this[name]) {
          return this[name].bind(this);
        }
        return proxy.element[name].bind(this.element);
      },
      set: (proxy, name, value) => {
        proxy.element[name] = value;
        return true;
      }
    });
    return this.proxy;
  }
  public ac_(child: SVGElement | WrappedSVGElement): WrappedSVGElement {
    if (child instanceof SVGElement) {
      this.element.appendChild(child);
    } else {
      this.element.appendChild(child.element);
    }
    return this.proxy;
  }
  public sa_(attr: string, value: string): WrappedSVGElement {
    this.element.setAttribute(attr, value);
    return this.proxy;
  }
  public rm_() {
    this.element.remove();
    return this.proxy;
  }

  /**
   * @param name - event name
   * @param handler - event handler
   * @returns {any} - proxy for this element
   * @private
   */
  public ael_(name, handler) {
    this.element.addEventListener(name, handler);
    return this.proxy;
  }
}
