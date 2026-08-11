"use client";

import { Component, type ReactNode } from "react";

export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(err: unknown) {
    console.error("Scene render failed:", err);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f2c] via-[#16245a] to-[#4b2a63]" />
      );
    }
    return this.props.children;
  }
}
