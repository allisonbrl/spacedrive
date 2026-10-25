import {Component, type ErrorInfo, type ReactNode} from 'react';
import {useI18n} from '../i18n';

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	error: Error | null;
}

function ErrorFallback({error, onReset}: {error: Error; onReset: () => void}) {
	const {t} = useI18n();
	return (
		<div className="bg-app flex h-screen items-center justify-center p-8">
			<div className="border-app-line bg-app-box max-w-2xl rounded-lg border p-8 shadow-lg">
				<h1 className="text-ink mb-4 text-2xl font-bold">
					{t('error.somethingWentWrong')}
				</h1>
				<p className="text-ink-dull mb-4">{t('error.restartPrompt')}</p>
				<details className="mb-4">
					<summary className="text-ink-faint hover:text-ink-dull cursor-pointer text-sm">
						{t('error.details')}
					</summary>
					<pre className="bg-app-darkBox text-ink-faint mt-2 overflow-auto rounded p-4 text-xs">
						{error.toString()}
						{error.stack}
					</pre>
				</details>
				<button
					onClick={onReset}
					className="bg-accent hover:bg-accent-deep rounded px-4 py-2 text-white"
				>
					{t('error.reload')}
				</button>
			</div>
		</div>
	);
}

/**
 * Error boundary for catching and displaying React errors.
 *
 * Must be a class component as React doesn't provide hook-based error boundaries yet.
 * The fallback UI is extracted as a functional component for cleaner code.
 */
export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	state: ErrorBoundaryState = {error: null};

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return {error};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('ErrorBoundary caught an error:', error, errorInfo);
	}

	handleReset = () => {
		window.location.reload();
	};

	render() {
		if (this.state.error) {
			return (
				<ErrorFallback
					error={this.state.error}
					onReset={this.handleReset}
				/>
			);
		}

		return this.props.children;
	}
}
