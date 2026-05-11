export interface BattleActor {
  name: string;
  color: string;
}

export interface BattleAnimation {
  name: string;
  play(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    attacker: BattleActor,
    defender: BattleActor,
    scoreChange: number
  ): Promise<void>;
}
