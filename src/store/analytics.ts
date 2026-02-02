/**
 * Module-level mutable analytics state for high-frequency data
 * (Poincaré points, etc.) that shouldn't trigger React re-renders.
 */
export const analytics = {
  poincarePoints: [] as [number, number][],
  maxPoints: 8000,

  addPoincarePoint(x: number, y: number) {
    this.poincarePoints.push([x, y]);
    if (this.poincarePoints.length > this.maxPoints) {
      this.poincarePoints = this.poincarePoints.slice(-this.maxPoints);
    }
  },

  clear() {
    this.poincarePoints = [];
  },
};
