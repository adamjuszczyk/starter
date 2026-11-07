// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { ConfirmDialog } from './ConfirmDialog'
import type { ConfirmDialogProps } from './ConfirmDialog'
import { Panel } from './Panel'
import { renderInFrame } from '../testing/frame'

// Overload's five ConfirmDialog tests, adapted (the labels come from the caller; the dialog is drawn into the frame's overlay root), then the
// ones that are new: it works over an open panel (TASKS.md, Decided 6), it takes focus and owns Escape, and it draws nothing outside a frame.
// Overload's dialog was used by the delete-adjacent actions; the starter's is the delete confirmation of the Klienci example.

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  document.body.style.overflow = ''
})

const renderDialog = (props: Partial<ConfirmDialogProps> = {}) => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  renderInFrame(
    <ConfirmDialog
      title="Usunąć Piekarnię Pod Wawelem?"
      body="Klient zniknie z listy."
      confirmLabel="Usuń"
      cancelLabel="Anuluj"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
    { width: 390 },
  )
  return { onConfirm, onCancel }
}

const scrim = () => document.querySelector('[data-overlay-scrim]') as HTMLElement
const classesOf = (el: Element) => el.className.split(' ')
const press = (key: string, init: KeyboardEventInit = {}) => fireEvent.keyDown(document.activeElement ?? document.body, { key, ...init })

describe('ConfirmDialog', () => {
  it('shows the title, the body and the two buttons; the confirm button says what it was given and runs the confirm', () => {
    const { onConfirm, onCancel } = renderDialog()
    expect(screen.getByText('Usunąć Piekarnię Pod Wawelem?')).toBeTruthy()
    expect(screen.getByText('Klient zniknie z listy.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Usuń' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('a title with a word that has no break in it (a name the person typed) wraps inside the dialog: overflow-wrap anywhere (Overload: Chromium saw it run out of the card)', () => {
    const long = `Usunąć ${'B'.repeat(80)}?`
    renderDialog({ title: long })
    expect(classesOf(screen.getByText(long))).toContain('wrap-anywhere')
  })

  it('while pending the confirm button is disabled and says "…" unless it is given a pendingLabel (the default every caller had)', () => {
    renderDialog({ isPending: true })
    const button = screen.getByRole('button', { name: '…' }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(screen.queryByRole('button', { name: 'Usuń' })).toBeNull()
  })

  it('with a pendingLabel the button says that while pending, and its own label otherwise', () => {
    renderDialog({ isPending: true, pendingLabel: 'Usuwanie…' })
    expect((screen.getByRole('button', { name: 'Usuwanie…' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('button', { name: '…' })).toBeNull()
    cleanup()

    renderDialog({ isPending: false, pendingLabel: 'Usuwanie…' })
    expect(screen.getByRole('button', { name: 'Usuń' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Usuwanie…' })).toBeNull()
  })

  it('a tap on the scrim cancels; a tap inside the dialog does not', () => {
    const { onCancel } = renderDialog()
    fireEvent.click(screen.getByText('Klient zniknie z listy.'))
    fireEvent.click(screen.getByRole('alertdialog'))
    expect(onCancel).not.toHaveBeenCalled()
    fireEvent.click(scrim())
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('is red when `danger` and the app\'s accent otherwise', () => {
    renderDialog({ danger: true })
    expect(classesOf(screen.getByRole('button', { name: 'Usuń' }))).toContain('bg-danger')
    cleanup()
    renderDialog()
    expect(classesOf(screen.getByRole('button', { name: 'Usuń' }))).toContain('bg-accent')
    expect(classesOf(screen.getByRole('button', { name: 'Usuń' }))).not.toContain('bg-danger')
  })

  it('is an alert dialog named by its title and described by its body, that is modal', () => {
    renderDialog()
    const dialog = screen.getByRole('alertdialog', { name: 'Usunąć Piekarnię Pod Wawelem?' })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.getAttribute('aria-describedby')).toBe(screen.getByText('Klient zniknie z listy.').id)
    expect(scrim().getAttribute('aria-hidden')).toBe('true')
    expect(classesOf(dialog)).toContain('max-w-[380px]')
  })

  it("is drawn into the frame's overlay root with the overlay marker, and nothing is drawn where there is no frame", () => {
    renderDialog()
    const overlay = screen.getByRole('alertdialog').closest('[data-overlay]') as HTMLElement
    expect(overlay.getAttribute('data-overlay')).toBe('dialog')
    expect(overlay.parentElement?.style.transform).toBe('translateZ(0)')
    cleanup()

    const onCancel = vi.fn()
    render(<ConfirmDialog title="T" body="B" confirmLabel="Tak" cancelLabel="Nie" onConfirm={() => {}} onCancel={onCancel} />)
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    press('Escape')
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('takes focus when it opens, and Escape cancels, once; other keys do not', () => {
    const { onCancel } = renderDialog()
    expect(document.activeElement).toBe(screen.getByRole('alertdialog'))
    press('a')
    press('Enter')
    expect(onCancel).not.toHaveBeenCalled()
    press('Escape')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('locks the page behind while it is open and gives it back when it closes', () => {
    document.body.style.overflow = 'auto'
    const { unmount } = renderInFrame(
      <ConfirmDialog title="T" body="B" confirmLabel="Tak" cancelLabel="Nie" onConfirm={() => {}} onCancel={() => {}} />,
    )
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('auto')
  })
})

// The delete confirmation drawn over an open panel (TASKS.md, Decided 6): the dialog is the top overlay, so it takes Escape and Tab itself
// instead of the panel under it closing.
describe('ConfirmDialog over an open Panel', () => {
  function PanelWithDelete({ onPanelClose, onDelete }: { onPanelClose: () => void; onDelete: () => void }) {
    const [confirming, setConfirming] = useState(false)
    return (
      <>
        <Panel
          title="Piekarnia Pod Wawelem"
          onClose={onPanelClose}
          closeLabel="Zamknij"
          footer={
            <button type="button" onClick={() => setConfirming(true)}>
              Usuń klienta
            </button>
          }
        >
          <input aria-label="Nazwa" />
        </Panel>
        {confirming && (
          <ConfirmDialog
            title="Usunąć klienta?"
            body="Tego nie da się cofnąć."
            confirmLabel="Usuń"
            cancelLabel="Anuluj"
            danger
            onConfirm={onDelete}
            onCancel={() => setConfirming(false)}
          />
        )}
      </>
    )
  }

  function openDialogOverPanel() {
    const onPanelClose = vi.fn()
    const onDelete = vi.fn()
    renderInFrame(<PanelWithDelete onPanelClose={onPanelClose} onDelete={onDelete} />, { width: 390 })
    const deleteButton = screen.getByRole('button', { name: 'Usuń klienta' })
    deleteButton.focus()
    fireEvent.click(deleteButton)
    return { onPanelClose, onDelete, deleteButton }
  }

  it('is drawn above the panel, in the same overlay root', () => {
    openDialogOverPanel()
    const panel = screen.getByRole('dialog', { name: 'Piekarnia Pod Wawelem' }).closest('[data-overlay]') as HTMLElement
    const dialog = screen.getByRole('alertdialog').closest('[data-overlay]') as HTMLElement
    expect(panel.parentElement).toBe(dialog.parentElement)
    expect(Boolean(panel.compareDocumentPosition(dialog) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true)
    expect(document.activeElement).toBe(screen.getByRole('alertdialog'))
  })

  it('Escape cancels the dialog and leaves the panel open; the next Escape closes the panel', () => {
    const { onPanelClose } = openDialogOverPanel()
    press('Escape')
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByRole('dialog', { name: 'Piekarnia Pod Wawelem' })).toBeTruthy()
    expect(onPanelClose).not.toHaveBeenCalled()
    // with the dialog gone, the panel is the top overlay again and owns the key
    press('Escape')
    expect(onPanelClose).toHaveBeenCalledTimes(1)
  })

  it('Tab stays in the dialog: the ends wrap, and focus that was in the panel is pulled in', () => {
    openDialogOverPanel()
    const dialog = screen.getByRole('alertdialog')
    const cancel = within(dialog).getByRole('button', { name: 'Anuluj' })
    const confirm = within(dialog).getByRole('button', { name: 'Usuń' })
    confirm.focus()
    expect(press('Tab')).toBe(false)
    expect(document.activeElement).toBe(cancel)
    expect(press('Tab', { shiftKey: true })).toBe(false)
    expect(document.activeElement).toBe(confirm)
    // focus in the panel under the dialog (here its × button) is outside the one on top: Tab is pulled up into the dialog
    screen.getByRole('button', { name: 'Zamknij' }).focus()
    expect(press('Tab')).toBe(false)
    expect(document.activeElement).toBe(cancel)
  })

  it('closing it returns focus to what had it in the panel', () => {
    const { deleteButton } = openDialogOverPanel()
    expect(document.activeElement).toBe(screen.getByRole('alertdialog'))
    fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(document.activeElement).toBe(deleteButton)
  })

  it('the page stays locked until the panel is gone too', () => {
    document.body.style.overflow = 'auto'
    openDialogOverPanel()
    expect(document.body.style.overflow).toBe('hidden')
    press('Escape')
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(document.body.style.overflow).toBe('hidden')
  })
})
