import React from 'react';
import config from '#config';

const links = [
	{
		title: 'Github',
		description: 'Workspace collaboration, source code for project',
		href: 'https://github.com/Enzo0721/RegistrarBot'
	}
];

// pings health on the backend
async function health() {
	const res = await fetch(config.API_URL+'/health');
	const json = await res.json();
	console.log(json);
	return json;
}

async function testroute() {
	const res = await fetch(config.API_URL+'/api/v1/test/ping');
	const text = await res.text();
	console.log(text);
	return text;
}

export default function HomePage() {
	return (
		<div className="min-h-screen bg-gray-900 text-gray-100 antialiased">
			<header className="bg-gray-900 border-b border-gray-800">
				<div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
					<h1 className="text-xl font-semibold">Registrar Bot</h1>
				</div>
			</header>
			<button onClick={health}>test server health</button>
			<button onClick={testroute}>test route</button>
			<section className="py-20 text-center">
				<h2 className="text-4xl font-bold mb-4">
					Welcome to the Registrar Bot Sandbox 
				</h2>
				<p className="text-lg max-w-2xl mx-auto text-gray-400">
					This is the link tree of all the essential links and info you need.
					Click through to learn more.
				</p>
			</section>

			{/* Info Cards */}
			<section className="py-12 px-6 max-w-5xl mx-auto grid gap-6 md:grid-cols-2">
				{links.map((link) => (
					<a
						key={link.title}
						href={link.href}
						className="block p-5 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 hover:border-gray-600 hover:shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-400"
					>
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-lg font-medium">{link.title}</h3>
						</div>
						<p className="text-gray-400 text-sm">{link.description}</p>
					</a>
				))}
			</section>

			{/* Footer */}
			<footer className="border-t border-gray-800 py-6 text-center text-sm text-gray-500">
				© {new Date().getFullYear()} Personaforge. All rights reserved.
			</footer>
		</div>
	);
}
