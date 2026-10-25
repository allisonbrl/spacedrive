import {
	DiscordLogo,
	GithubLogo,
	GlobeHemisphereWest
} from '@phosphor-icons/react';
import {BallBlue} from '@sd/assets/images';
import {CircleButton} from '@spacedrive/primitives';
import {motion} from 'framer-motion';
import Orb from '../../components/Orb';
import contributors from '../../contributors.json';
import {useI18n} from '../../i18n';

export function AboutSettings() {
	const {t} = useI18n();

	return (
		<div className="flex min-h-[600px] flex-col items-center justify-center">
			{/* Animated orb with ball */}
			<motion.div
				initial={{scale: 0.8, opacity: 0}}
				animate={{scale: 1, opacity: 1}}
				transition={{duration: 0.6, ease: 'easeOut'}}
				className="relative mb-8 h-64 w-64"
			>
				{/* Ball image - behind the orb */}
				<div className="absolute inset-[8%] z-0">
					<img
						src={BallBlue}
						alt="Spacedrive"
						className="h-full w-full select-none object-contain"
						draggable={false}
					/>
				</div>
				{/* Orb animation - inset to make it smaller */}
				<div className="absolute inset-[15%] z-10">
					<Orb
						palette="blue"
						hue={0}
						hoverIntensity={0}
						rotateOnHover={false}
						forceHoverState={true}
					/>
				</div>
			</motion.div>

			{/* Branding */}
			<motion.div
				initial={{opacity: 0, y: 10}}
				animate={{opacity: 1, y: 0}}
				transition={{duration: 0.5, delay: 0.3}}
				className="mb-6 text-center"
			>
				<h3 className="mb-2 text-2xl font-bold text-white">
					Spacedrive
				</h3>
				<p className="text-sm text-white/60">
					{t('settings.about.subtitle')}
				</p>
			</motion.div>

			{/* Manifesto */}
			<motion.div
				initial={{opacity: 0, y: 10}}
				animate={{opacity: 1, y: 0}}
				transition={{duration: 0.5, delay: 0.35}}
				className="mb-8 max-w-md px-4 text-center"
			>
				<p className="text-sm leading-relaxed text-white/70">
					{t('settings.about.manifesto')}
				</p>
			</motion.div>

			{/* Links */}
			<motion.div
				initial={{opacity: 0, y: 10}}
				animate={{opacity: 1, y: 0}}
				transition={{duration: 0.5, delay: 0.4}}
				className="mb-6 flex gap-3"
			>
				<a
					href="https://spacedrive.com"
					target="_blank"
					rel="noopener noreferrer"
				>
					<CircleButton icon={GlobeHemisphereWest}>
						{t('settings.about.website')}
					</CircleButton>
				</a>
				<a
					href="https://github.com/spacedriveapp/spacedrive"
					target="_blank"
					rel="noopener noreferrer"
				>
					<CircleButton icon={GithubLogo}>
						{t('settings.about.github')}
					</CircleButton>
				</a>
				<a
					href="https://discord.gg/spacedrive"
					target="_blank"
					rel="noopener noreferrer"
				>
					<CircleButton icon={DiscordLogo}>
						{t('settings.about.discord')}
					</CircleButton>
				</a>
			</motion.div>

			{/* Contributors */}
			<motion.div
				initial={{opacity: 0, y: 10}}
				animate={{opacity: 1, y: 0}}
				transition={{duration: 0.5, delay: 0.45}}
				className="mb-8 max-w-lg px-4 text-center"
			>
				<p className="text-[11px] leading-relaxed text-white/30">
					{contributors.map(
						(c: {name: string; github: string}, i) => (
							<span key={c.github}>
								{i > 0 && ' · '}
								<a
									href={`https://github.com/${c.github}`}
									target="_blank"
									rel="noopener noreferrer"
									title={`@${c.github}`}
									className="transition-colors hover:text-white/50"
								>
									{c.name}
								</a>
							</span>
						)
					)}
				</p>
			</motion.div>

			{/* License */}
			<motion.div
				initial={{opacity: 0}}
				animate={{opacity: 1}}
				transition={{duration: 0.5, delay: 0.55}}
				className="text-center"
			>
				<a
					href="https://github.com/spacedriveapp/spacedrive/blob/main/LICENSE"
					target="_blank"
					rel="noopener noreferrer"
					className="text-sm text-white/40 transition-colors hover:text-white/60"
				>
					Apache-2.0
				</a>
			</motion.div>
		</div>
	);
}
