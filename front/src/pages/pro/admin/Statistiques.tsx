// Page Statistiques admin - vue analytique complete.
// CA mensuel (12 derniers mois), top clients fideles, repartition
// des commandes par statut. Complement du dashboard.

import { useState, useEffect, useMemo } from 'react'
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts'
import { TrendingUp, Award, ShoppingBag } from 'lucide-react'
import { api } from '../../../services/api'
import './Statistiques.css'

interface CaMensuel {
    mois: string
    nombreCommandes: number
    chiffreAffaires: number
}

interface ClientFidele {
    id: number
    prenom: string
    nom: string
    email: string
    nombreCommandes: number
    totalDepense: number
}

interface ResumeDashboard {
    commandes: {
        total: number
        parStatut?: Record<string, number>
    }
    chiffreAffaires: { total: number }
    utilisateurs: { actifs: number }
    avis: { valides: number; noteMoyenne: number }
}

export default function Statistiques() {
    const [caMensuel, setCaMensuel] = useState<CaMensuel[]>([])
    const [clientsFideles, setClientsFideles] = useState<ClientFidele[]>([])
    const [resume, setResume] = useState<ResumeDashboard | null>(null)
    const [chargement, setChargement] = useState(true)
    const [erreur, setErreur] = useState<string | null>(null)

    useEffect(() => {
        async function charger() {
            try {
                setChargement(true)
                setErreur(null)
                const [ca, fideles, dash] = await Promise.all([
                    api.get<{ statistiques: CaMensuel[] }>('/api/stats/chiffre-affaires'),
                    api.get<{ clients: ClientFidele[] }>('/api/stats/clients-fideles'),
                    api.get<ResumeDashboard>('/api/stats/dashboard'),
                ])
                // On inverse l'ordre du CA pour afficher du plus ancien au plus recent
                setCaMensuel((ca.statistiques || []).slice().reverse())
                setClientsFideles(fideles.clients || [])
                setResume(dash)
            } catch (err: any) {
                setErreur(err?.message || 'Impossible de charger les statistiques.')
            } finally {
                setChargement(false)
            }
        }
        charger()
    }, [])

    // Format des mois en francais pour l'affichage
    const dataCaFormate = useMemo(() => {
        return caMensuel.map((m) => {
            const [annee, mois] = m.mois.split('-')
            const moisNoms = [
                'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
                'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
            ]
            const moisIdx = parseInt(mois, 10) - 1
            return {
                ...m,
                moisLabel: `${moisNoms[moisIdx]} ${annee.slice(2)}`,
            }
        })
    }, [caMensuel])

    if (chargement) {
        return (
            <div className="d-flex justify-content-center py-5">
                <div className="spinner-border" style={{ color: 'var(--color-bordeaux)' }} role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="statistiques">
            <h1 className="titre-serif s-titre">Statistiques détaillées</h1>
            <p className="s-sous-titre">
                Vue d'ensemble de la performance sur les 12 derniers mois
            </p>

            {erreur && (
                <div className="alert alert-danger" role="alert">
                    {erreur}
                </div>
            )}

            {/* Resume KPIs */}
            <section className="s-kpis">
                <div className="s-kpi">
                    <ShoppingBag size={20} className="s-kpi-icone" />
                    <div>
                        <div className="s-kpi-label">Commandes totales</div>
                        <div className="s-kpi-valeur">{resume?.commandes.total ?? 0}</div>
                    </div>
                </div>
                <div className="s-kpi">
                    <TrendingUp size={20} className="s-kpi-icone" />
                    <div>
                        <div className="s-kpi-label">CA total</div>
                        <div className="s-kpi-valeur">
                            {Math.round(resume?.chiffreAffaires.total ?? 0).toLocaleString('fr-FR')} €
                        </div>
                    </div>
                </div>
                <div className="s-kpi">
                    <Award size={20} className="s-kpi-icone" />
                    <div>
                        <div className="s-kpi-label">Clients fidèles</div>
                        <div className="s-kpi-valeur">{clientsFideles.length}</div>
                    </div>
                </div>
            </section>

            {/* CA mensuel - line chart */}
            <section className="s-carte">
                <h2 className="titre-serif s-carte-titre">
                    Chiffre d'affaires mensuel (12 derniers mois)
                </h2>
                {dataCaFormate.length === 0 ? (
                    <p className="text-muted">Pas encore de données sur cette période.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                            data={dataCaFormate}
                            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
                            <XAxis dataKey="moisLabel" stroke="#6B7280" fontSize={12} />
                            <YAxis stroke="#6B7280" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    background: '#FFFFFF',
                                    border: '1px solid #E8E8E8',
                                    borderRadius: 8,
                                }}
                                formatter={(v: number, name: string) =>
                                    name === 'chiffreAffaires'
                                        ? [`${v.toFixed(2)} €`, 'CA']
                                        : [v, 'Commandes']
                                }
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="chiffreAffaires"
                                name="Chiffre d'affaires"
                                stroke="#7B2D26"
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#7B2D26' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </section>

            {/* Commandes mensuelles - bar chart */}
            <section className="s-carte">
                <h2 className="titre-serif s-carte-titre">Volume de commandes par mois</h2>
                {dataCaFormate.length === 0 ? (
                    <p className="text-muted">Pas encore de données sur cette période.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={dataCaFormate}
                            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
                            <XAxis dataKey="moisLabel" stroke="#6B7280" fontSize={12} />
                            <YAxis stroke="#6B7280" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    background: '#FFFFFF',
                                    border: '1px solid #E8E8E8',
                                    borderRadius: 8,
                                }}
                                formatter={(v: number) => [`${v} commandes`, '']}
                            />
                            <Bar
                                dataKey="nombreCommandes"
                                name="Nombre de commandes"
                                fill="#3E5C4A"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </section>

            {/* Top clients fideles */}
            <section className="s-carte">
                <h2 className="titre-serif s-carte-titre">
                    <Award size={18} aria-hidden="true" />
                    Top 10 des clients fidèles
                </h2>
                {clientsFideles.length === 0 ? (
                    <p className="text-muted">Aucun client fidèle pour le moment.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="s-table table-cartes">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Client</th>
                                    <th>Email</th>
                                    <th>Commandes</th>
                                    <th>Total dépensé</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientsFideles.slice(0, 10).map((c, idx) => (
                                    <tr key={c.id}>
                                        <td data-label="Rang" className="s-rang">
                                            {idx === 0 && '🥇'}
                                            {idx === 1 && '🥈'}
                                            {idx === 2 && '🥉'}
                                            {idx > 2 && <span className="text-muted">{idx + 1}</span>}
                                        </td>
                                        <td data-label="Client" className="td-stack">
                                            <div className="s-client-cell">
                                                <div className="s-client-avatar" aria-hidden="true">
                                                    {c.prenom?.[0]?.toUpperCase()}
                                                    {c.nom?.[0]?.toUpperCase()}
                                                </div>
                                                <strong>
                                                    {c.prenom} {c.nom}
                                                </strong>
                                            </div>
                                        </td>
                                        <td data-label="Email" className="text-muted">{c.email}</td>
                                        <td data-label="Commandes">
                                            <strong>{c.nombreCommandes}</strong>
                                        </td>
                                        <td data-label="Total dépensé" className="s-montant">
                                            {Math.round(Number(c.totalDepense)).toLocaleString('fr-FR')} €
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Note moyenne */}
            <section className="s-carte s-note-moyenne">
                <h2 className="titre-serif s-carte-titre">Satisfaction client</h2>
                <div className="s-note-grande">
                    <span className="s-note-chiffre">
                        {(resume?.avis.noteMoyenne ?? 0).toFixed(1)}
                    </span>
                    <span className="s-note-sur">/ 5</span>
                </div>
                <p className="text-muted text-center">
                    Note moyenne sur {resume?.avis.valides ?? 0} avis validés
                </p>
            </section>
        </div>
    )
}
