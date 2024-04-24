import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { usePostBackend } from '../hooks/queryBackend'
// import { useMemoDeepComp } from '../hooks/deepCompare'
import { Button, IconButton, ListSubheader, MenuItem, Paper, Select, TextField, Tooltip, Typography } from '@mui/material'
import { Add, AutoAwesome, Delete, DragIndicator, HelpOutline } from '@mui/icons-material'
import { authCreds, MS_IN_DAY, MS_IN_WEEK, MS_IN_YEAR } from '../utils'
import {
  RequestWithAuth,
  BaseNoteList,
  Note,
  NoteList,
  UserProfiles,
  CreateNoteRequest,
  CreateActionItemRequest,
  CreateActionItemResponse,
  CreateNoteResponse,
  DeleteActionItemRequest,
  DeleteActionItemResponse,
  DeleteNoteRequest,
  DeleteNoteResponse,
  ReorderActionItemRequest,
  ReorderActionItemResponse,
  UpdateActionItemRequest,
  UpdateActionItemResponse,
  UpdateNoteRequest,
  UpdateNoteResponse,
  GenerateActionItemsRequest,
  GenerateActionItemsResponse,
  GenerateAdviceTooltipsRequest,
  GenerateAdviceTooltipsResponse
} from '../types'
import {
  actionItemIconStyle,
  actionItemIconEmptyStyle,
  buttonStyle,
  contentWindowStyle,
  iconButtonBaseStyle,
  spacedButtonDivStyle,
  contentHeaderStyle,
  helpIconInactiveStyle,
  jobPaperStyle,
  requestPanelStyle,
  pageStyle,
  leftPanelStyle,
  autoIconStyle,
  topDropdownStyle,
  selectMenuProps,
  dropdownHeaderStyle,
  singleRowStyle,
  tightTextStyle,
  textFieldStyle
} from '../styles'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

type GetBaseNoteList = () => BaseNoteList

const baseNoteList: GetBaseNoteList = () => {
  const curTime = Date.now()
  return [
    { label: 'Last 24 Hours', cutoffTime: curTime - MS_IN_DAY, notes: [] },
    { label: 'Last Week', cutoffTime: curTime - MS_IN_WEEK, notes: [] },
    { label: 'Last 2 Weeks', cutoffTime: curTime - MS_IN_WEEK * 2, notes: [] },
    { label: 'Last 4 Weeks', cutoffTime: curTime - MS_IN_WEEK * 4, notes: [] },
    { label: 'Last 3 Months', cutoffTime: curTime - MS_IN_DAY * 90, notes: [] },
    { label: 'Last Year', cutoffTime: curTime - MS_IN_YEAR, notes: [] },
    { label: 'Historical', cutoffTime: 0, notes: [] }
  ]
}

const addActionItemTooltip = "Add action item"
const createNoteTooltip = "Add note"
const deleteActionItemTooltip = "Delete action item"
const deleteNoteTooltip = "Delete note"
const genAllActionItems = "Generate all action items"
const genAllActionItemAdvice = "Generate advice for all action items"

type NotePaperArgs = {
  note: Note
  allNotes: Note[]
  setOpenNoteUuid: React.Dispatch<React.SetStateAction<string | undefined>>
  updateNote: (request: UpdateNoteRequest) => void
  deleteNote: (request: DeleteNoteRequest) => void
  createActionItem: (request: CreateActionItemRequest) => void
  updateActionItem: (request: UpdateActionItemRequest) => void
  deleteActionItem: (request: DeleteActionItemRequest) => void
  reorderActionItem: (request: ReorderActionItemRequest) => void
  generateActionItems: (request: GenerateActionItemsRequest) => void
  generateAdviceTooltips: (request: GenerateAdviceTooltipsRequest) => void
  setAllNotes: React.Dispatch<React.SetStateAction<Note[]>>
}

const NotePaper = ({
  note,
  setOpenNoteUuid,
  allNotes,
  updateNote,
  deleteNote,
  createActionItem,
  updateActionItem,
  deleteActionItem,
  generateActionItems,
  generateAdviceTooltips,
  setAllNotes,
  reorderActionItem
}: NotePaperArgs) => {
  const [cursorOver, setCursorOver] = useState<number | null>(null)

  const handleDragItem = useCallback((result) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (sourceIndex === destinationIndex) return

    const actionItemUuid = note.actionItems[sourceIndex].uuid

    let prevActionItemUuid
    const offset = destinationIndex < sourceIndex ? 1 : 0
    if (destinationIndex > 0) prevActionItemUuid = note.actionItems[destinationIndex - offset].uuid

    reorderActionItem({
      ...authCreds(),
      actionItemUuid,
      prevActionItemUuid
    })

    setAllNotes((allNotes) => {
      const updatedAllNotes = [...allNotes];
      const noteIndex = updatedAllNotes.findIndex((n) => n.uuid === note.uuid);

      const updatedActionItems = [...updatedAllNotes[noteIndex].actionItems];
      const [removed] = updatedActionItems.splice(sourceIndex, 1);
      updatedActionItems.splice(destinationIndex, 0, removed);

      updatedAllNotes[noteIndex].actionItems = updatedActionItems;
      return updatedAllNotes;
    })
  }, [note, allNotes])

  return (
    <div style={contentWindowStyle}>
      <Paper style={jobPaperStyle} elevation={3}>
        <table>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top' }}>
                <Typography variant='body1' sx={contentHeaderStyle}>
                  Last Updated:
                </Typography>
                <Typography variant='body1' sx={contentHeaderStyle}>
                  {(new Date(note.updatedAt)).toLocaleString()}
                </Typography>
                <IconButton onClick={() => {
                  deleteNote({
                    ...authCreds(),
                    noteUuid: note.uuid
                  })

                  const allNotesState = [...allNotes]

                  for (let i = 0; i < allNotes.length; i++) {
                    if (allNotes[i].uuid === note.uuid) {
                      allNotesState.splice(i, 1)
                      break
                    }
                  }

                  setAllNotes(allNotesState)
                  setOpenNoteUuid(allNotesState[0]?.uuid)
                }}>
                  <Tooltip title={deleteNoteTooltip} placement="top">
                    <div>
                      <Delete fontSize="large" sx={iconButtonBaseStyle} />
                    </div>
                  </Tooltip>
                </IconButton>
                <IconButton onClick={() => {
                  generateAdviceTooltips({
                    ...authCreds(),
                    noteUuid: note.uuid
                  })
                }}>
                  <Tooltip title={genAllActionItemAdvice} placement="top">
                    <div>
                      <HelpOutline fontSize="large" style={iconButtonBaseStyle} />
                      <AutoAwesome fontSize="large" sx={autoIconStyle} />
                    </div>
                  </Tooltip>
                </IconButton>
              </td>
              <td style={{ verticalAlign: 'top' }}>
                <div style={{ width: '56em' }}>
                  <TextField value={note.body} sx={textFieldStyle} multiline maxRows={10} onInput={(event) => {
                    const text = (event.target as HTMLInputElement).value
                    updateNote({
                      ...authCreds(),
                      noteUuid: note.uuid,
                      body: text
                    })
                    setAllNotes(allNotesState => {
                      for (let i = 0; i < allNotesState.length; i++) {
                        if (allNotesState[i].uuid === note.uuid) {
                          allNotesState[i].body = text
                          allNotesState[i].updatedAt = new Date().toISOString()
                          break
                        }
                      }
                      return [...allNotesState]
                    })
                  }} />
                  <Typography variant='body1' sx={contentHeaderStyle}>Action Items:</Typography>
                  <DragDropContext onDragEnd={handleDragItem}>
                    <Droppable droppableId="actionItems">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                          {note.actionItems.map((actionItem, i) => (
                            <Draggable key={actionItem.uuid} draggableId={actionItem.uuid} index={i}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <div key={i} style={tightTextStyle} onMouseEnter={() => setCursorOver(i)} onMouseLeave={() => setCursorOver(null)}>
                                    {cursorOver === i ? <DragIndicator fontSize="large" style={actionItemIconStyle} /> : <div style={actionItemIconEmptyStyle} />}
                                    {actionItem.adviceTooltip
                                      ? (
                                        <Tooltip title={actionItem.adviceTooltip} placement="top">
                                          <div>
                                            <HelpOutline fontSize="large" style={actionItemIconStyle} />
                                          </div>
                                        </Tooltip>
                                      ) : (
                                        <HelpOutline fontSize="large" color='disabled' style={helpIconInactiveStyle} />
                                      )}
                                    <TextField value={actionItem.body} sx={textFieldStyle} multiline maxRows={10} onInput={(event) => {
                                      const text = (event.target as HTMLInputElement).value
                                      updateActionItem({
                                        ...authCreds(),
                                        actionItemUuid: actionItem.uuid,
                                        body: text
                                      })
                                      setAllNotes(allNotesState => {
                                        for (let j = 0; j < allNotesState.length; j++) {
                                          if (allNotesState[j].uuid === note.uuid) {
                                            allNotesState[j].actionItems[i].body = text
                                            break
                                          }
                                        }
                                        return [...allNotesState]
                                      })
                                    }} />
                                    <IconButton onClick={() => {
                                      deleteActionItem({
                                        ...authCreds(),
                                        actionItemUuid: actionItem.uuid
                                      })
                                      setAllNotes(allNotesState => {
                                        for (let j = 0; j < allNotesState.length; j++) {
                                          if (allNotesState[j].uuid === note.uuid) {
                                            let previousActionItem, nextActionItem

                                            if (i < allNotesState[j].actionItems.length - 1) nextActionItem = allNotesState[j].actionItems[i + 1]
                                            if (i > 0) previousActionItem = allNotesState[j].actionItems[i - 1]
                                            if (nextActionItem) nextActionItem.previousActionItemUuid = previousActionItem?.uuid
                                            if (previousActionItem) previousActionItem.nextActionItemUuid = nextActionItem?.uuid

                                            allNotesState[j].actionItems.splice(i, 1)

                                            break
                                          }
                                        }
                                        return [...allNotesState]
                                      })
                                    }}>
                                      <Tooltip title={deleteActionItemTooltip} placement="top">
                                        <div>
                                          <Delete fontSize="large" sx={iconButtonBaseStyle} />
                                        </div>
                                      </Tooltip>
                                    </IconButton>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </div>
                      )}

                    </Droppable>
                  </DragDropContext>
                  <IconButton onClick={() => createActionItem({
                    ...authCreds(),
                    noteUuid: note.uuid,
                    body: ""
                  })}>
                    <Tooltip title={addActionItemTooltip} placement="top">
                      <div>
                        <Add fontSize="large" sx={iconButtonBaseStyle} />
                      </div>
                    </Tooltip>
                  </IconButton>
                  <IconButton onClick={() => generateActionItems({
                    ...authCreds(),
                    noteUuid: note.uuid
                  })}>
                    <Tooltip title={genAllActionItems} placement="top">
                      <div>
                        <Add fontSize="large" sx={iconButtonBaseStyle} />
                        <AutoAwesome fontSize="large" sx={autoIconStyle} />
                      </div>
                    </Tooltip>
                  </IconButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </Paper>
    </div>
  )
}

type NotesPageArgs = {
  userProfiles?: UserProfiles["body"]
}

export const NotesPage = ({ userProfiles }: NotesPageArgs) => {
  const {
    sendRequest: fetchNotes,
    loading: loadingNotes,
    response: notes
  } = usePostBackend<RequestWithAuth, NoteList>('note/listNotes')

  const {
    sendRequest: createNote,
    loading: creatingNote,
    response: createdNote
  } = usePostBackend<CreateNoteRequest, CreateNoteResponse>('note/createNote')

  const {
    sendRequest: updateNote,
    loading: updatingNote,
    response: updatedNote
  } = usePostBackend<UpdateNoteRequest, UpdateNoteResponse>('note/updateNote')

  const {
    sendRequest: deleteNote,
    loading: deletingNote,
    response: deletedNote
  } = usePostBackend<DeleteNoteRequest, DeleteNoteResponse>('note/deleteNote')

  const {
    sendRequest: createActionItem,
    loading: creatingActionItem,
    response: createdActionItem
  } = usePostBackend<CreateActionItemRequest, CreateActionItemResponse>('actionItem/createActionItem')

  const {
    sendRequest: updateActionItem,
    loading: updatingActionItem,
    response: updatedActionItem
  } = usePostBackend<UpdateActionItemRequest, UpdateActionItemResponse>('actionItem/updateActionItem')

  const {
    sendRequest: deleteActionItem,
    loading: deletingActionItem,
    response: deletedActionItem
  } = usePostBackend<DeleteActionItemRequest, DeleteActionItemResponse>('actionItem/deleteActionItem')

  const {
    sendRequest: reorderActionItem,
    loading: reorderingActionItem,
    response: reorderedActionItem
  } = usePostBackend<ReorderActionItemRequest, ReorderActionItemResponse>('actionItem/reorderActionItem')

  const {
    sendRequest: generateActionItems,
    loading: generatingActionItems,
    response: generatedActionItems
  } = usePostBackend<GenerateActionItemsRequest, GenerateActionItemsResponse>('actionItem/generateActionItems')

  const {
    sendRequest: generateAdviceTooltips,
    loading: generatingAdviceTooltips,
    response: generatedAdviceTooltips
  } = usePostBackend<GenerateAdviceTooltipsRequest, GenerateAdviceTooltipsResponse>('actionItem/generateAdviceTooltips')

  const [allNotes, setAllNotes] = useState<Note[]>([])

  const [openNoteUuid, setOpenNoteUuid] = useState<string | undefined>(undefined)

  const noteMap = useMemo(() => allNotes.reduce((mappedNotes: { [uuid: string]: Note }, note) => {
    mappedNotes[note.uuid] = note
    return mappedNotes
  }, {}), [allNotes])

  const NoteMenuList = useMemo(() => {
    const noteMenuSet = allNotes.reduce((noteList: BaseNoteList, note) => {
      const lastUpdatedTime = new Date(note.updatedAt).getTime()
      for (const window of noteList) {
        if (lastUpdatedTime > window.cutoffTime) {
          window.notes.push(note)
          break
        }
      }
      return noteList
    }, baseNoteList())

    const noteMenuList = noteMenuSet.reduce((list: React.ReactElement[], window) => {
      if (!window.notes.length) return list

      list.push(<ListSubheader style={dropdownHeaderStyle} key={window.label}>{window.label}</ListSubheader>)
      for (const w of window.notes) {
        list.push(<MenuItem value={w.uuid} key={w.uuid}>{w.body.slice(0, 100) || "(empty)"}</MenuItem>)
      }
      return list
    }, [])

    return noteMenuList
  }, [allNotes])

  useMemo(() => fetchNotes(authCreds()), [fetchNotes])

  useEffect(() => {
    if (notes?.error || !notes?.body) return
    setAllNotes(notes.body)
    setOpenNoteUuid(notes.body[0]?.uuid)
  }, [notes])

  useEffect(() => {
    if (createdNote?.error || !createdNote?.body) return
    setAllNotes([createdNote?.body, ...allNotes])
    setOpenNoteUuid(createdNote?.body.uuid)
  }, [createdNote])

  useEffect(() => {
    if (createdActionItem?.error || !createdActionItem?.body) return
    setAllNotes(allNotesState => {
      for (let j = 0; j < allNotesState.length; j++) {
        if (allNotesState[j].uuid === createdActionItem.body.noteUuid) {
          allNotesState[j].actionItems.push(createdActionItem.body)
          break
        }
      }
      return allNotesState
    })
  }, [createdActionItem])

  return (
    <div style={pageStyle}>
      <div style={leftPanelStyle}>
        <div style={singleRowStyle}>
        <Select value={openNoteUuid ?? ""} disabled={allNotes.length === 0} sx={topDropdownStyle} MenuProps={selectMenuProps} onChange={(event) => {
          setOpenNoteUuid(event.target.value)
        }}>
          {NoteMenuList}
        </Select>
        <IconButton onClick={() => createNote({
          ...authCreds(),
          body: ""
        })}>
          <Tooltip title={createNoteTooltip} placement="top">
            <div>
              <Add fontSize="large" sx={iconButtonBaseStyle} />
            </div>
          </Tooltip>
        </IconButton>
        </div>
      </div>
      {userProfiles?.discordUser && openNoteUuid && (
        <NotePaper
          note={noteMap[openNoteUuid]}
          allNotes={allNotes}
          setOpenNoteUuid={setOpenNoteUuid}
          updateNote={updateNote}
          deleteNote={deleteNote}
          createActionItem={createActionItem}
          updateActionItem={updateActionItem}
          deleteActionItem={deleteActionItem}
          reorderActionItem={reorderActionItem}
          generateActionItems={generateActionItems}
          generateAdviceTooltips={generateAdviceTooltips}
          setAllNotes={setAllNotes}
        />
      )}
    </div>
  )
}

export default NotesPage
