import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Scanner;

public class Grader {
    public static void main(String[] args) throws IOException, InterruptedException {
        String inPath = System.getenv("INPUT_PATH");
        String ansPath = System.getenv("ANSWER_PATH");

        String runCmd = System.getenv("RUN_CMD");

        Runtime rt = Runtime.getRuntime();

        Process p = rt.exec(runCmd);
        try {
            pipeStream(new FileInputStream(inPath), p.getOutputStream());
        }catch(IOException ioe) {}

        if(p.waitFor() != 0){
            System.out.println("RTE");
            return;
        }

        ArrayList<String> ans = new ArrayList<>();
        ArrayList<String> produced = new ArrayList<>();

        Scanner in = new Scanner(new BufferedInputStream(new FileInputStream(ansPath)));
        while(in.hasNextLine()) ans.add(in.nextLine().trim());

        Scanner program = new Scanner(new BufferedInputStream(p.getInputStream()));
        while(program.hasNextLine()) produced.add(program.nextLine().trim());

        if(ans.equals(produced)) System.out.println("AC");
        else System.out.println("WA");

        in.close();
        program.close();
    }

    public static void pipeStream(InputStream input, OutputStream output)
            throws IOException
    {
        byte buffer[] = new byte[1024];
        int numRead = 0;

        do
        {
            numRead = input.read(buffer);
            output.write(buffer, 0, numRead);
        } while (input.available() > 0);

        output.flush();
    }
}
