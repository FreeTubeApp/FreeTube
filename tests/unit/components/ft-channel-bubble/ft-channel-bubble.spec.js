import { render, screen, fireEvent, waitFor } from '@testing-library/vue'
import '@testing-library/jest-dom'
import FtChannelBubble from '../../../../src/renderer/components/ft-channel-bubble/ft-channel-bubble.vue'

describe('FtChannelBubble.vue', () => {
  const channelName = 'Test Channel'
  const channelThumbnail =
    'https://yt3.ggpht.com/ytc/AAUvcnjb_9ivQr8bJ-eKAJ9ug4wNSqgxjVcY9XJRYA7KZg=s48-c-k-c0x00ffffff-no-rj'

  it('displays channel name', () => {
    render(FtChannelBubble, {
      propsData: {
        channelName: channelName,
        channelThumbnail: channelThumbnail
      }
    })

    expect(screen.getByText(channelName)).toBeInTheDocument()
  })

  it('displays channel thumbnail', () => {
    render(FtChannelBubble, {
      propsData: {
        channelName: channelName,
        channelThumbnail: channelThumbnail
      }
    })
    expect(screen.getByTestId('image')).toHaveAttribute('src', channelThumbnail)
  })

  it('displays icon if show selected', () => {
    render(FtChannelBubble, {
      propsData: {
        channelName: channelName,
        channelThumbnail: channelThumbnail,
        showSelected: true
      }
    })

    fireEvent.click(screen.getByRole('toggle-bubble'))

    waitFor(() =>
      expect(screen.getByTestId('font')).toHaveAttribute('icon', 'check')
    )
  })

  it('hides icon if not show selected', () => {
    render(FtChannelBubble, {
      propsData: {
        channelName: channelName,
        channelThumbnail: channelThumbnail,
        showSelected: false
      }
    })

    fireEvent.click(screen.getByRole('toggle-bubble'))

    waitFor(() =>
      expect(screen.getByTestId('font')).not.toHaveAttribute('icon', 'check')
    )
  })
})
