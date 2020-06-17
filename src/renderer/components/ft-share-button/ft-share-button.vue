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

			<ft-button class="action">
				<font-awesome-icon icon="copy"></font-awesome-icon>
				Copy link
			</ft-button>
			<ft-button class="action">
				<font-awesome-icon icon="globe"></font-awesome-icon>
				Open link
			</ft-button>

			<div class="divider"></div>

			<div class="header invidious"><span class="invidiousLogo"></span>Invidious</div>

			<ft-button class="action">
				<font-awesome-icon icon="copy"></font-awesome-icon>
				Copy link
			</ft-button>
			<ft-button class="action">
				<font-awesome-icon icon="globe"></font-awesome-icon>
				Open link
			</ft-button>
		</div>
	</ft-icon-button>
</template>

<script src="./ft-share-button.js" />
<style scoped lang="sass" src="./ft-share-button.sass" />
