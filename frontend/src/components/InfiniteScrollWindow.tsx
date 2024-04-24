import React, { useEffect, useRef, useLayoutEffect, useCallback, useState } from 'react'
import TableContainer from '@material-ui/core/TableContainer'
import CircularProgress from '@material-ui/core/CircularProgress'

type InfiniteScrollWindowArgs<Row> = {
  sx?: React.CSSProperties
  formattedRow: (row: Row, index: number, onLoad: () => void) => JSX.Element
  loading: boolean
  loadMore: () => void
  allRows: Row[]
  direction: 'backwards' | 'forwards'
}

export const InfiniteScrollWindow = <Row extends any>({
  sx, formattedRow, loading, loadMore, allRows, direction
}: InfiniteScrollWindowArgs<Row>) => {

  const tableRef = useRef<HTMLDivElement>(null)

  const table = tableRef.current

  const [scrollPositionFromBottom, setScrollPositionFromBottom] = useState(0)

  const updateScrollTop = useCallback(() => {
    console.log({f: 'updateScrollTop', scrollTop: table?.scrollTop, scrollHeight: table?.scrollHeight, clientHeight: table?.clientHeight, scrollPositionFromBottom })
    if (table) table.scrollTop = table.scrollHeight - (scrollPositionFromBottom || table.clientHeight)
  }, [scrollPositionFromBottom, table])

  const scrollListener = useCallback(() => {
    console.log({f: 'scrollListener', scrollTop: table?.scrollTop, scrollHeight: table?.scrollHeight, clientHeight: table?.clientHeight, scrollPositionFromBottom })
    if (table &&
      (
        (direction === 'backwards' && table.scrollTop <= 0) ||
        (direction === 'forwards' && table.scrollTop >= table.scrollHeight)
      )
    ) {
      setScrollPositionFromBottom(direction === 'backwards' ? table.scrollHeight : 0)
      loadMore()
    }
  }, [loadMore, table])

  useLayoutEffect(() => {
    if (!table) return
    table.addEventListener('scroll', scrollListener)
    return () => table.removeEventListener('scroll', scrollListener)
  }, [scrollListener, table])

  useEffect(() => {
    console.log({f: 'useEffect', scrollTop: table?.scrollTop, scrollHeight: table?.scrollHeight, clientHeight: table?.clientHeight, scrollPositionFromBottom })
    if (direction === 'backwards') updateScrollTop()
  }, [allRows, direction, updateScrollTop])

  return (
    <TableContainer style={sx} ref={tableRef}>
      {loading && <CircularProgress style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />}
      {allRows.map((row, i) => formattedRow(row, i, updateScrollTop))}
    </TableContainer>
  )
}
