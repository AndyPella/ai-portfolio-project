import snapshot from "../../data/northstar-ridge-demo-data.json";
import RentalWorkspace from "../rental-workspace";
import { validateRentalDataset } from "../../domain/rental-validation";
export default function WorkspacePage() { return <RentalWorkspace source={validateRentalDataset(snapshot)} />; }
