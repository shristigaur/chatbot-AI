'use client';

import { Component } from 'react';

export default class MessageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Assistant message render failed:', error, info);
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      const developmentMessage = process.env.NODE_ENV !== 'production' && this.state.error?.message;
      return <div className="message-error" role="alert">
        <strong>This message could not be displayed.</strong>
        {developmentMessage && <code>{developmentMessage}</code>}
        <button type="button" onClick={() => this.setState({ hasError: false, error: null })}>Retry</button>
      </div>;
    }
    return this.props.children;
  }
}