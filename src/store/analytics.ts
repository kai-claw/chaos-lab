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
      // In-place splice instead of slice (avoids creating a new array)
      this.poincarePoints.splice(0, this.poincarePoints.length - this.maxPoints);
    }
  },

  clear() {
    this.poincarePoints.length = 0;
  },
};
