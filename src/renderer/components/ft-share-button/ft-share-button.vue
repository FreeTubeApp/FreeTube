<template>
	<ft-icon-button
		title="Share Video"
		theme="secondary"
		icon="share-alt"
		:forceDropdown="true"
	>
		<div class="shareLinks">
			<div class="header">
				<img class="youtubeLogo" src="~../../assets/img/yt_logo_mono_dark.png" alt="YouTube" width="794" height="178">
			</div>

			<div class="buttons">
				<ft-button
					class="action"
					@click="copyYoutube()"
				>
					<font-awesome-icon icon="copy"/>
					Copy link
				</ft-button>
				<ft-button
					class="action"
					@click="openYoutube()"
				>
					<font-awesome-icon icon="globe"/>
					Open link
				</ft-button>
				<ft-button
					class="action"
					@click="copyYoutubeEmbed()"
				>
					<font-awesome-icon icon="file-video"/>
					Copy embed
				</ft-button>
				<ft-button
					class="action"
					@click="openYoutubeEmbed()"
				>
					<font-awesome-icon icon="file-video"/>
					Open embed
				</ft-button>
			</div>

			<div class="divider"></div>

			<div class="header invidious"><span class="invidiousLogo"/>Invidious</div>

			<div class="buttons">
				<ft-button
					class="action"
					@click="copyInvidious()"
				>
					<font-awesome-icon icon="copy"/>
					Copy link
				</ft-button>
				<ft-button
					class="action"
					@click="openInvidious()"
				>
					<font-awesome-icon icon="globe"/>
					Open link
				</ft-button>
				<ft-button
					class="action"
					@click="copyInvidiousEmbed()"
				>
					<font-awesome-icon icon="file-video"/>
					Copy embed
				</ft-button>
				<ft-button
					class="action"
					@click="openInvidiousEmbed()"
				>
					<font-awesome-icon icon="file-video"/>
					Open embed
				</ft-button>
			</div>
		</div>
	</ft-icon-button>
</template>

<script src="./ft-share-button.js" />
<style scoped lang="sass" src="./ft-share-button.sass" />
