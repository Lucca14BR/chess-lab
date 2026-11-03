import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { Dexie } from 'dexie'
import { ChessLabDB, STORES_V1, STORES_V2, STORES_V3, STORES_V4, db } from '@/lib/db/schema'
import { clearAllData, exportBackup, importBackup } from '@/lib/services/backup'
import { MAX_MUSIC_BYTES, addMusicFiles, checkMusicFile, musicSaveError, removeMusicTrack, trackName } from './musicLibrary'

beforeEach(async () => {
  await db.musicTracks.clear()
})

describe('checkMusicFile', () => {
  it('aceita áudio até 50 MB', () => {
    expect(checkMusicFile({ name: 'a.mp3', type: 'audio/mpeg', size: 1000 })).toBeNull()
    expect(checkMusicFile({ name: 'a.ogg', type: 'audio/ogg', size: MAX_MUSIC_BYTES })).toBeNull()
  })
  it('recusa arquivo grande demais', () => {
    expect(checkMusicFile({ name: 'longa.mp3', type: 'audio/mpeg', size: MAX_MUSIC_BYTES + 1 })).toMatch(/50 MB/)
  })
  it('recusa o que não é áudio', () => {
    expect(checkMusicFile({ name: 'foto.png', type: 'image/png', size: 10 })).toMatch(/áudio/)
  })
  it('sem tipo informado, decide pela extensão', () => {
    expect(checkMusicFile({ name: 'faixa.flac', type: '', size: 10 })).toBeNull()
    expect(checkMusicFile({ name: 'notas.txt', type: '', size: 10 })).toMatch(/áudio/)
  })
})

describe('trackName', () => {
  it('tira a extensão e troca sublinhados', () => {
    expect(trackName('Minha_musica.mp3')).toBe('Minha musica')
    expect(trackName('sem-extensao')).toBe('sem-extensao')
    expect(trackName('.mp3')).toBe('.mp3')
  })
})

describe('musicSaveError', () => {
  it('falta de espaço vira mensagem clara', () => {
    const quota = Object.assign(new Error('x'), { name: 'QuotaExceededError' })
    expect(musicSaveError(quota)).toMatch(/espaço/)
    // o Dexie embrulha o erro original
    expect(musicSaveError(Object.assign(new Error('y'), { name: 'AbortError', inner: quota }))).toMatch(/espaço/)
  })
  it('outros erros têm mensagem genérica', () => {
    expect(musicSaveError(new Error('z'))).toMatch(/Não foi possível/)
  })
})

describe('addMusicFiles e removeMusicTrack', () => {
  it('guarda as válidas e relata as recusadas', async () => {
    const ok = new File(['abc'], 'Chuva_de_verao.mp3', { type: 'audio/mpeg' })
    const bad = new File(['x'], 'capa.jpg', { type: 'image/jpeg' })
    const r = await addMusicFiles([ok, bad], () => 42)
    expect(r.added).toBe(1)
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0]).toMatch(/capa\.jpg/)
    const rows = await db.musicTracks.toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ name: 'Chuva de verao', type: 'audio/mpeg', size: 3, addedAt: 42 })
    await removeMusicTrack(rows[0].id)
    expect(await db.musicTracks.count()).toBe(0)
  })
})

describe('músicas e o backup', () => {
  const row = { id: 't1', name: 'Faixa', type: 'audio/mpeg', size: 3, addedAt: 1, blob: new Blob(['abc'], { type: 'audio/mpeg' }) }

  it('o backup não exporta as músicas', async () => {
    await db.musicTracks.put(row)
    const data = JSON.parse(await exportBackup())
    expect(data.tables.musicTracks).toBeUndefined()
    expect(JSON.stringify(data)).not.toContain('Faixa')
  })
  it('restaurar um backup não apaga as músicas', async () => {
    await db.musicTracks.put(row)
    await importBackup(JSON.stringify({ app: 'chess-lab', tables: { settings: [] } }))
    expect(await db.musicTracks.count()).toBe(1)
  })
  it('apagar os dados locais apaga as músicas', async () => {
    await db.musicTracks.put(row)
    await clearAllData()
    expect(await db.musicTracks.count()).toBe(0)
  })
})

describe('upgrade do banco v2 → v3', () => {
  it('mantém as tabelas e os dados e cria musicTracks', async () => {
    const name = 'upgrade-v2-v3'
    const old = new Dexie(name)
    old.version(1).stores(STORES_V1)
    old.version(2).stores(STORES_V2)
    await old.open()
    await old.table('notes').put({ id: 'n1', title: 'Nota', body: '', category: '', collectionIds: [], tags: [], fen: null, gameRef: null, favorite: false, isMistake: false, createdAt: 1, updatedAt: 1 })
    await old.table('secrets').put({ key: 'gemini', value: 'k' })
    await old.table('tutorMessages').put({ id: 'm1', threadId: 't', createdAt: 1 })
    old.close()

    const next = new ChessLabDB(name)
    await next.open()
    expect(next.verno).toBe(4) // abre na versão atual (v4 acrescentou chatThreads)
    expect((await next.notes.get('n1'))?.title).toBe('Nota')
    expect((await next.secrets.get('gemini'))?.value).toBe('k')
    expect(await next.tutorMessages.count()).toBe(1)
    expect(await next.musicTracks.count()).toBe(0)
    expect(next.tables.map((t) => t.name).sort()).toEqual([...Object.keys(STORES_V1), ...Object.keys(STORES_V2), ...Object.keys(STORES_V3), ...Object.keys(STORES_V4)].sort())
    next.close()
  })
})
