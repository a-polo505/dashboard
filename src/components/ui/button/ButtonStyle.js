// ButtonStyle.js
class ButtonStyle {
    static default() {
      return {
        padding: '10px 20px',
        borderRadius: '5px',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: '#007BFF',
        color: '#FFF',
      };
    }
  
    static hover() {
      return {
        backgroundColor: '#0056b3',
      };
    }
  
    static active() {
      return {
        backgroundColor: '#004085',
      };
    }
  
    static focus() {
      return {
        outline: '2px solid #80bdff',
        outlineOffset: '2px',
      };
    }
  }
  
  export { ButtonStyle };
  