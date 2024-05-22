class ButtonStyle {
  static default() {
    return {
      padding: "10px 20px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      backgroundColor: "#007BFF",
      color: "#FFF",
    };
  }

  static hover() {
    return {
      backgroundColor: "#ffffff",
    };
  }

  static active() {
    return {
      backgroundColor: "#004085",
    };
  }

  static focus() {
    return {
      outline: "2px solid #80bdff",
      outlineOffset: "2px",
    };
  }
}

export { ButtonStyle };
