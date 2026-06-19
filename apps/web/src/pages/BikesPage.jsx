import { useState } from 'react'
import { addBike, deleteBike } from '@/lib/api'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, Bike } from 'lucide-react'

export function BikesPage({ bikes, onBikeAdded, onBikeDeleted }) {
  const [open, setOpen] = useState(false)
  const [newId, setNewId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!newId.trim()) { setError('Informe o ID da bike'); return }
    setLoading(true)
    setError('')
    try {
      const bike = await addBike(newId.trim())
      onBikeAdded(bike)
      setOpen(false)
      setNewId('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm(`Remover ${id}?`)) return
    try {
      await deleteBike(id)
      onBikeDeleted(id)
    } catch (err) {
      alert(err.message)
    }
  }

  const bikeList = Object.values(bikes)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bike className="text-primary" />
            Gerenciamento de Bikes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {bikeList.length} bike{bikeList.length !== 1 ? 's' : ''} cadastrada{bikeList.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} className="mr-2" />
          Adicionar bike
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Velocidade</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Última atualização</TableHead>
                <TableHead>Corridas</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {bikeList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    Nenhuma bike cadastrada ainda
                  </TableCell>
                </TableRow>
              )}
              {bikeList.map(bike => (
                <TableRow key={bike.id}>
                  <TableCell className="font-mono font-medium">{bike.id}</TableCell>
                  <TableCell><StatusBadge status={bike.status} /></TableCell>
                  <TableCell>{bike.speed != null ? `${Number(bike.speed).toFixed(1)} km/h` : '—'}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {bike.lat && bike.lng ? `${bike.lat.toFixed(4)}, ${bike.lng.toFixed(4)}` : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {bike.updatedAt ? new Date(bike.updatedAt).toLocaleString('pt-BR') : '—'}
                  </TableCell>
                  <TableCell>{bike._count?.rides ?? 0}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(bike.id)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Bike</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Label>ID da bike</Label>
            <Input
              value={newId}
              onChange={e => setNewId(e.target.value)}
              placeholder="Ex: BIKE_002"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={loading}>
              {loading ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
