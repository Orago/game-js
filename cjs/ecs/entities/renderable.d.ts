import { Component } from '../component.js';
export declare class Renderable extends Component {
    callback: () => void;
    constructor(callback: () => void);
}
