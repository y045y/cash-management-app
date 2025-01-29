import React, { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorMessage: '' };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, errorMessage: error.toString() };
    }

    componentDidCatch(error, errorInfo) {
        console.error("エラーが発生しました:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-message">
                    <h2>エラーが発生しました</h2>
                    <p>{this.state.errorMessage}</p>
                    <button onClick={() => window.location.reload()}>再読み込み</button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
