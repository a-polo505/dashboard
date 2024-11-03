class ButtonStyle {
  static default() {
    return {
      padding: "10px 20px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      backgroundColor: "#007BFF",
      color: "#FFFFFF",
    };
  }

  static hover() {
    return {
      backgroundColor: "#FFFFFF",
    };
  }

  static active() {
    return {
      backgroundColor: "#004085",
    };
  }

  static focus() {
    return {
      outline: "2px solid #80BDFF",
      outlineOffset: "2px",
    };
  }
}

export { ButtonStyle };
